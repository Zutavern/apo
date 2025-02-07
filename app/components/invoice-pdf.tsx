import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface InvoiceProps {
  partner: {
    company_name: string
    contact_person: string
    street: string
    zip_code: string
    city: string
    vat_id: string
  }
  campaign: {
    start_date: string
    end_date: string
    price_per_month: number
    total_price: number
  }
  invoiceNumber: string
  invoiceDate: Date
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  logo: {
    width: 150,
    marginBottom: 15,
  },
  addressBlock: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottom: '1pt solid #e2e8f0',
  },
  partnerAddress: {
    marginTop: 30,
    marginBottom: 30,
  },
  invoiceTitle: {
    fontSize: 16,
    marginBottom: 15,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  invoiceDetails: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: 120,
    color: '#4a5568',
  },
  value: {
    flex: 1,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 6,
    marginBottom: 8,
    color: '#4a5568',
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  col1: {
    flex: 2,
  },
  col2: {
    flex: 1,
    textAlign: 'right',
  },
  totalSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  total: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  totalLabel: {
    width: 120,
    textAlign: 'right',
    marginRight: 8,
    color: '#4a5568',
  },
  totalValue: {
    width: 80,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 15,
    fontSize: 8,
    color: '#4a5568',
  },
  footerText: {
    marginBottom: 3,
  },
})

export function InvoicePDF({ partner, campaign, invoiceNumber, invoiceDate }: InvoiceProps) {
  const netAmount = campaign.total_price
  const vat = netAmount * 0.19
  const totalAmount = netAmount + vat

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image 
              src="/Users/danielzutavern/Documents/ina_clean2/public/images/logo.png"
              style={styles.logo}
            />
            <View style={styles.addressBlock}>
              <Text>Neue Apotheke</Text>
              <Text>Friedensstr. 1</Text>
              <Text>06679 Hohenmölsen</Text>
              <Text>Tel: 034441 33135</Text>
              <Text>E-Mail: Service@meineneueapotheke.de</Text>
            </View>
          </View>
        </View>

        {/* Partner Address */}
        <View style={styles.partnerAddress}>
          <Text>{partner.company_name}</Text>
          <Text>z.Hd. {partner.contact_person}</Text>
          <Text>{partner.street}</Text>
          <Text>{partner.zip_code} {partner.city}</Text>
        </View>

        {/* Invoice Title & Details */}
        <View style={styles.invoiceDetails}>
          <Text style={styles.invoiceTitle}>Rechnung</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Rechnungsnummer:</Text>
            <Text style={styles.value}>{invoiceNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Rechnungsdatum:</Text>
            <Text style={styles.value}>{format(invoiceDate, 'dd. MMMM yyyy', { locale: de })}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>USt-IdNr.:</Text>
            <Text style={styles.value}>{partner.vat_id}</Text>
          </View>
        </View>

        {/* Service Details */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Leistungsbeschreibung</Text>
            <Text style={styles.col2}>Betrag</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.col1}>
              Werbekampagne Digital Signage{'\n'}
              Zeitraum: {format(new Date(campaign.start_date), 'dd.MM.yyyy', { locale: de })} - {format(new Date(campaign.end_date), 'dd.MM.yyyy', { locale: de })}
            </Text>
            <Text style={styles.col2}>{netAmount.toFixed(2)} €</Text>
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalSection}>
          <View style={styles.total}>
            <Text style={styles.totalLabel}>Nettobetrag:</Text>
            <Text style={styles.totalValue}>{netAmount.toFixed(2)} €</Text>
          </View>
          <View style={styles.total}>
            <Text style={styles.totalLabel}>MwSt. 19%:</Text>
            <Text style={styles.totalValue}>{vat.toFixed(2)} €</Text>
          </View>
          <View style={styles.total}>
            <Text style={styles.totalLabel}>Gesamtbetrag:</Text>
            <Text style={styles.totalValue}>{totalAmount.toFixed(2)} €</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Neue Apotheke • Friedensstr. 1 • 06679 Hohenmölsen</Text>
          <Text style={styles.footerText}>Tel: 034441 33135 • E-Mail: Service@meineneueapotheke.de</Text>
          <Text style={styles.footerText}>Bankverbindung: Kreissparkasse Burgenlandkreis • IBAN: DE80 8005 3000 3600 1302 17</Text>
        </View>
      </Page>
    </Document>
  )
} 