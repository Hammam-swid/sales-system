import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { SaleDto } from '../../../shared/sales'
import { t } from '../i18n/ar'
import { formatDateTime, formatMoney, formatQuantity } from '../lib/format'
import { useAuthStore } from '../store/auth'
import { usePrintStore } from '../store/print'
import { useSettingsStore } from '../store/settings'

// 80mm thermal receipt. Plain black on white with fixed sizes: it is printed, not themed.
export function Receipt({ sale }: { sale: SaleDto }) {
  const settings = useSettingsStore((state) => state.settings)
  const money = (value: number) => formatMoney(value, settings.currency)
  const remaining = Math.max(0, sale.total - sale.paidAmount)

  return (
    <div className="receipt">
      <header className="receipt-center">
        <div className="receipt-title">{settings.storeName || t.appName}</div>
        {settings.storeAddress && <div>{settings.storeAddress}</div>}
        {settings.storePhone && <div dir="ltr">{settings.storePhone}</div>}
      </header>

      <div className="receipt-rule" />
      <div className="receipt-center receipt-strong">{t.receipt.invoice}</div>
      <div className="receipt-row">
        <span>{t.pos.invoiceNumber}</span>
        <span dir="ltr">{sale.invoiceNumber}</span>
      </div>
      <div className="receipt-row">
        <span>{t.sales.date}</span>
        <span>{formatDateTime(sale.createdAt)}</span>
      </div>
      {sale.userName && (
        <div className="receipt-row">
          <span>{t.receipt.cashier}</span>
          <span>{sale.userName}</span>
        </div>
      )}
      {sale.customerName && (
        <div className="receipt-row">
          <span>{t.receipt.customer}</span>
          <span>{sale.customerName}</span>
        </div>
      )}

      <div className="receipt-rule" />
      {sale.items.map((item) => (
        <div key={item.id} className="receipt-item">
          <div>{item.productName}</div>
          <div className="receipt-row">
            <span>
              {formatQuantity(item.quantity)} × {money(item.unitPrice)}
              {item.discount > 0 && ` − ${money(item.discount)}`}
            </span>
            <span>{money(item.total)}</span>
          </div>
        </div>
      ))}

      <div className="receipt-rule" />
      <div className="receipt-row">
        <span>{t.pos.subtotal}</span>
        <span>{money(sale.subtotal)}</span>
      </div>
      {sale.discount > 0 && (
        <div className="receipt-row">
          <span>{t.pos.discount}</span>
          <span>− {money(sale.discount)}</span>
        </div>
      )}
      {sale.tax > 0 && (
        <div className="receipt-row">
          <span>{t.sales.tax}</span>
          <span>{money(sale.tax)}</span>
        </div>
      )}
      <div className="receipt-row receipt-total">
        <span>{t.pos.total}</span>
        <span>{money(sale.total)}</span>
      </div>
      <div className="receipt-row">
        <span>{t.sales.paid}</span>
        <span>{money(sale.paidAmount)}</span>
      </div>
      {remaining > 0 && (
        <div className="receipt-row">
          <span>{t.sales.remaining}</span>
          <span>{money(remaining)}</span>
        </div>
      )}

      <div className="receipt-rule" />
      <footer className="receipt-center">{t.receipt.thanks}</footer>
    </div>
  )
}

// Mounted once in the app shell. When an invoice is queued for printing it renders the
// receipt outside the app root (which the print stylesheet hides) and opens the print dialog.
export function PrintHost() {
  const sale = usePrintStore((state) => state.sale)
  const done = usePrintStore((state) => state.done)
  const signedIn = useAuthStore((state) => state.user !== null)

  useEffect(() => {
    if (!sale) return
    window.addEventListener('afterprint', done, { once: true })
    // Let the receipt paint before the dialog opens.
    const timer = setTimeout(() => window.print(), 50)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('afterprint', done)
    }
  }, [sale, done])

  if (!sale || !signedIn) return null
  return createPortal(
    <div className="print-host">
      <Receipt sale={sale} />
    </div>,
    document.body
  )
}
