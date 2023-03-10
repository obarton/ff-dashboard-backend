export const InsertAttendeesSQL = `INSERT INTO attendees 
(
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
    ip_location
) VALUES ?`

export const InsertEventsSQL = `INSERT INTO events 
(
    event_id, 
    event_name, 
    venue_name,
    event_date 
) VALUES ?`

export const InsertOrdersSQL = `INSERT INTO orders 
(
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
) VALUES ?`

export const InsertSquareDoorSalesSQL = `INSERT INTO square_door_sales 
(
    date,
    time,
    timezone,
    category,
    item,
    quantity,
    price_point_name,
    sku,
    modifiers_applied,
    gross_sales,
    discounts,
    net_sales,
    tax,
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
) VALUES ?`