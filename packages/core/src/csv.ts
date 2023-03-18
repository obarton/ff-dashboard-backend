import { parseDateAttending, convertDateToMysqlFormat} from "./date";
import { parseEventbriteLocationCity, parseEventbriteLocationState, parseEventbriteLocationCountry} from "./location";

export const mapAttendeesCsvValues = (row: any) => {
    const attendee_num = row['Attendee #']
    const order_num = row['Order #']
    const first_name = row['First Name']
    const last_name = row['Last Name']
    const email = row['Email']
    const billing_address_1 = row['Billing Address 1']
    const billing_address_2 = row['Billing Address 2']
    const billing_state = row['Billing State']
    const billing_zip = row['Billing Zip']
    const billing_country = row['Billing Country']
    const attendee_notes = row['Attendee Notes']
    const quantity = row['Quantity']
    const price_tier = row['Price Tier']
    const ticket_type = row['Ticket Type']
    const barcode_num = row['Barcode #']
    const date_attending = parseDateAttending(row['Date Attending'])
    const device_name = row['Device Name']
    const check_in_date = convertDateToMysqlFormat(row['Check-In Date'])
    const attendee_status = row['Attendee Status']
    const ip_location_city = parseEventbriteLocationCity(row['IP Location'])
    const ip_location_state = parseEventbriteLocationState(row['IP Location'])
    const ip_location_country = parseEventbriteLocationCountry(row['IP Location'])
    const ip_location = row['IP Location']

  return [ 
    attendee_num, 
    order_num, 
    first_name, 
    last_name, 
    email, 
    billing_address_1, 
    billing_address_2, 
    billing_state, 
    billing_zip,
    billing_country,
    attendee_notes,
    quantity,
    price_tier,
    ticket_type,
    barcode_num,
    date_attending,
    device_name,
    check_in_date,
    attendee_status,
    ip_location_city,
    ip_location_state,
    ip_location_country,
    ip_location,
  ]
}

export const mapEventsCsvValues = (row: any) => {
  const event_id = row['Event ID']
  const event_name = row['Event Name']
  const venue_name = row['Venue Name']
  const event_date = parseDateAttending(row['Date Attending'])

  return [ 
    event_id, 
    event_name, 
    venue_name,
    event_date
  ]
}

export const mapOrdersCsvValues = (row: any) => {
  const order_num = row['Order #']
  const event_id = row['Event ID']
  const order_date = row['Order Date']
  const total_paid = row['Total Paid']
  const fees_paid = row['Fees Paid']
  const ticketing_platform_fees = row['Eventbrite Fees']
  const ticketing_platform_payment_processing_fees = row['Eventbrite Payment Processing']
  const order_type = row['Order Type']
  const order_notes = row['Order Notes']
  const attendee_status = row['Attendee Status']

  return [ 
    order_num, 
    event_id, 
    order_date,
    total_paid,
    fees_paid,
    ticketing_platform_fees,
    ticketing_platform_payment_processing_fees,
    order_type,
    order_notes,
    attendee_status
  ]
}

export const mapSquareDoorSalesCsvValues = (row: any) => {
  const date = row['Date']
  const time = row['Time']
  const timezone = row['Time Zone']
  const category = row['Category']
  const item = row['Item']
  const quantity = row['Qty']
  const price_point_name = row['Price Point Name']
  const sku = row['SKU']
  const modifiers_applied = row['Modifiers Applied']
  const gross_sales = row['Gross Sales']
  const discounts = row['Discounts']
  const net_sales = row['Net Sales']
  const tax = row['Tax']
  const transaction_id = row['Transaction ID']
  const payment_id = row['Payment ID']
  const device_name = row['Device Name']
  const notes = row['Notes']
  const details = row['Details']
  const event_type = row['Event Type']
  const location = row['Location']
  const dining_option = row['Dining Option']
  const customer_id = row['Customer ID']
  const customer_name = row['Customer Name']
  const customer_reference_id = row['Customer Reference ID']
  const unit = row['Unit']
  const count = row['Count']
  const itemization_type = row['Itemization Type']
  const fufillment_note = row['Fulfillment Note']

  return [ 
    date,
    time,
    timezone,
    category,
    item,
    quantity,
    price_point_name,
    sku,
    modifiers_applied,
    parseFloat(gross_sales.replace('$', '')),
    parseFloat(discounts.replace('$', '')),
    parseFloat(net_sales.replace('$', '')),
    parseFloat(tax.replace('$', '')),
    transaction_id,
    payment_id,
    device_name,
    notes,
    details,
    event_type,
    location,
    dining_option,
    customer_id,
    customer_name,
    customer_reference_id,
    unit,
    count,
    itemization_type,
    fufillment_note
  ]
}

export const mapFacebookReachCsvValues = (row: any, index: number) => {
  if (index === 0) {
    return;
  }

  return {
    date: row['Date'],
    reach: row['Reach']
  }
}
