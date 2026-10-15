import type { SaleDto } from '../../../shared/sales'
import { formatOrderNumber, warrantyEnd } from '../../../shared/store'
import { t } from '../i18n'
import { formatDate, formatDateTime, formatMoney, formatQuantity } from '../lib/format'
import { useSettingsStore } from '../store/settings'

// 80mm thermal receipt. Plain black on white with fixed sizes: it is printed, not themed.
export function Receipt({ sale }: { sale: SaleDto }) {
  const settings = useSettingsStore((state) => state.settings)
  const money = (value: number) => formatMoney(value, settings.currency)
  const remaining = Math.max(0, sale.total - sale.paidAmount)

  return (
    <div className="receipt">
      <header className="receipt-center">
        {settings.storeLogo && <img src={settings.storeLogo} alt="" className="receipt-logo" />}
        <div className="receipt-title">{settings.storeName || t.appName}</div>
        {settings.storeAddress && <div>{settings.storeAddress}</div>}
        {settings.storePhone && <div dir="ltr">{settings.storePhone}</div>}
      </header>

      <div className="receipt-rule" />
      {sale.orderNumber !== null && (
        <div className="receipt-center">
          <div>{t.receipt.orderNumber}</div>
          <div dir="ltr" className="receipt-order-number">
            {formatOrderNumber(sale.orderNumber)}
          </div>
        </div>
      )}
      <div className="receipt-center receipt-strong">{t.receipt.invoice}</div>
      <div className="receipt-row">
        <span>{t.pos.invoiceNumber}</span>
        <span dir="ltr">{sale.invoiceNumber}</span>
      </div>
      {sale.orderType && (
        <div className="receipt-row">
          <span>{t.pos.orderType}</span>
          <span>{t.orderTypes[sale.orderType]}</span>
        </div>
      )}
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
          {item.note && <div className="receipt-note">{item.note}</div>}
          {item.warrantyMonths > 0 && (
            <div className="receipt-note">
              {t.receipt.warranty(
                item.warrantyMonths,
                formatDate(`${warrantyEnd(sale.createdAt, item.warrantyMonths)}T00:00:00`)
              )}
            </div>
          )}
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
