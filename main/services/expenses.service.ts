import type {
  ExpenseCategoryDto,
  ExpenseDto,
  ListExpensesResponse
} from '../../shared/expenses'
import { roundTo } from '../../shared/sales'
import type { SessionUser } from '../auth/session'
import { getDataSource } from '../database/data-source'
import { Expense, ExpenseCategory } from '../database/entities'
import { AppError } from '../errors'
import { recordAudit } from './audit.service'
import { likePattern } from './party.helpers'
import {
  asAmount,
  asDate,
  asId,
  asObject,
  asOptionalDate,
  asOptionalId,
  asOptionalText,
  asText
} from './validation'

const MAX_PAGE_SIZE = 100

export async function listExpenseCategories(): Promise<ExpenseCategoryDto[]> {
  const dataSource = getDataSource()
  const categories = await dataSource
    .getRepository(ExpenseCategory)
    .find({ order: { name: 'ASC' } })

  const counts: { categoryId: number; count: number }[] = await dataSource
    .getRepository(Expense)
    .createQueryBuilder('expense')
    .select('expense.categoryId', 'categoryId')
    .addSelect('COUNT(*)', 'count')
    .where('expense.categoryId IS NOT NULL')
    .groupBy('expense.categoryId')
    .getRawMany()
  const countById = new Map(counts.map((row) => [row.categoryId, Number(row.count)]))

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    expenseCount: countById.get(category.id) ?? 0
  }))
}

export async function saveExpenseCategory(payload: unknown): Promise<ExpenseCategoryDto> {
  const input = asObject(payload)
  const id = asOptionalId(input.id, 'id')
  const name = asText(input.name, 'name', 60)
  const dataSource = getDataSource()
  const repository = dataSource.getRepository(ExpenseCategory)

  if (id === null) {
    const created = await repository.save(repository.create({ name }))
    return { id: created.id, name: created.name, expenseCount: 0 }
  }
  const category = await repository.findOneBy({ id })
  if (!category) throw new AppError('NOT_FOUND')
  category.name = name
  await repository.save(category)
  return {
    id,
    name,
    expenseCount: await dataSource.getRepository(Expense).countBy({ categoryId: id })
  }
}

export async function deleteExpenseCategory(payload: unknown): Promise<null> {
  const id = asId(asObject(payload).id)
  await getDataSource().transaction(async (manager) => {
    const repository = manager.getRepository(ExpenseCategory)
    if (!(await repository.existsBy({ id }))) throw new AppError('NOT_FOUND')
    // Expenses must keep their category, or past reports would lose their breakdown.
    if (await manager.getRepository(Expense).existsBy({ categoryId: id })) {
      throw new AppError('RECORD_IN_USE')
    }
    await repository.delete({ id })
  })
  return null
}

function toExpenseDto(expense: Expense): ExpenseDto {
  return {
    id: expense.id,
    categoryId: expense.categoryId,
    categoryName: expense.category?.name ?? null,
    amount: expense.amount,
    expenseDate: expense.expenseDate,
    note: expense.note,
    userName: expense.user?.fullName ?? null,
    createdAt: expense.createdAt.toISOString()
  }
}

export async function listExpenses(payload: unknown): Promise<ListExpensesResponse> {
  const input = payload === undefined || payload === null ? {} : asObject(payload)
  const from = asOptionalDate(input.from, 'from')
  const to = asOptionalDate(input.to, 'to')
  const categoryId = asOptionalId(input.categoryId, 'categoryId')
  const search = asOptionalText(input.search, 'search', 100)
  const page = Math.max(1, Math.floor(Number(input.page) || 1))
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(Number(input.pageSize) || 25)))

  const filtered = () => {
    const query = getDataSource().getRepository(Expense).createQueryBuilder('expense')
    // Dates are stored as YYYY-MM-DD, so text comparison is date comparison.
    if (from) query.andWhere('expense.expenseDate >= :from', { from })
    if (to) query.andWhere('expense.expenseDate <= :to', { to })
    if (categoryId !== null) query.andWhere('expense.categoryId = :categoryId', { categoryId })
    if (search) {
      query.andWhere("expense.note LIKE :pattern ESCAPE '\\'", { pattern: likePattern(search) })
    }
    return query
  }

  const [expenses, total] = await filtered()
    .leftJoinAndSelect('expense.category', 'category')
    .leftJoinAndSelect('expense.user', 'user')
    .orderBy('expense.expenseDate', 'DESC')
    .addOrderBy('expense.id', 'DESC')
    .offset((page - 1) * pageSize)
    .limit(pageSize)
    .getManyAndCount()

  const sum: { total: number | null } | undefined = await filtered()
    .select('SUM(expense.amount)', 'total')
    .getRawOne()

  return {
    items: expenses.map(toExpenseDto),
    total,
    page,
    pageSize,
    totalAmount: roundTo(Number(sum?.total) || 0, 2)
  }
}

export async function saveExpense(payload: unknown, actor: SessionUser): Promise<ExpenseDto> {
  const input = asObject(payload)
  const id = asOptionalId(input.id, 'id')
  const fields = {
    categoryId: asId(input.categoryId, 'categoryId'),
    amount: asAmount(input.amount, 'amount'),
    expenseDate: asDate(input.expenseDate, 'expenseDate'),
    note: asOptionalText(input.note, 'note', 300)
  }
  if (fields.amount <= 0) throw new AppError('VALIDATION', 'amount')

  return getDataSource().transaction(async (manager) => {
    const repository = manager.getRepository(Expense)
    if (!(await manager.getRepository(ExpenseCategory).existsBy({ id: fields.categoryId }))) {
      throw new AppError('NOT_FOUND', 'category')
    }

    let expenseId: number
    if (id === null) {
      // "Recorded by" is whoever is signed in; it cannot be chosen from the screen.
      expenseId = (await repository.save(repository.create({ ...fields, userId: actor.id }))).id
    } else {
      const expense = await repository.findOneBy({ id })
      if (!expense) throw new AppError('NOT_FOUND')
      if (expense.amount !== fields.amount) {
        await recordAudit(
          {
            userId: actor.id,
            action: 'edit_expense',
            entityType: 'expense',
            entityId: id,
            details: { before: expense.amount, after: fields.amount }
          },
          manager
        )
      }
      await repository.save(Object.assign(expense, fields))
      expenseId = id
    }

    return toExpenseDto(
      await repository.findOneOrFail({
        where: { id: expenseId },
        relations: { category: true, user: true }
      })
    )
  })
}

export async function deleteExpense(payload: unknown, actor: SessionUser): Promise<null> {
  const id = asId(asObject(payload).id)
  await getDataSource().transaction(async (manager) => {
    const repository = manager.getRepository(Expense)
    const expense = await repository.findOneBy({ id })
    if (!expense) throw new AppError('NOT_FOUND')

    await repository.delete({ id })
    await recordAudit(
      {
        userId: actor.id,
        action: 'delete_expense',
        entityType: 'expense',
        entityId: id,
        details: {
          amount: expense.amount,
          expenseDate: expense.expenseDate,
          categoryId: expense.categoryId,
          note: expense.note
        }
      },
      manager
    )
  })
  return null
}
