import type { CustomerDto } from '../../shared/sales'
import { getDataSource } from '../database/data-source'
import { Customer } from '../database/entities'
import { asObject, asOptionalText } from './validation'

export function toCustomerDto(customer: Customer): CustomerDto {
  return { id: customer.id, name: customer.name, phone: customer.phone, balance: customer.balance }
}

export async function listCustomers(payload: unknown): Promise<CustomerDto[]> {
  const input = payload === undefined || payload === null ? {} : asObject(payload)
  const search = asOptionalText(input.search, 'search', 100)

  const query = getDataSource().getRepository(Customer).createQueryBuilder('customer')
  if (search) {
    const pattern = `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`
    query.where("(customer.name LIKE :pattern ESCAPE '\\' OR customer.phone LIKE :pattern ESCAPE '\\')", {
      pattern
    })
  }
  const customers = await query.orderBy('customer.name', 'ASC').limit(500).getMany()
  return customers.map(toCustomerDto)
}
