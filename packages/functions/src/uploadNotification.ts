import { parseDateAttending, convertDateToMysqlFormat} from "@dashboard-backend/core/date";
import { parseEventbriteLocationCity, parseEventbriteLocationState, parseEventbriteLocationCountry} from "@dashboard-backend/core/location";
import { InsertAttendeesSQL, InsertEventsSQL, InsertOrdersSQL, InsertSquareDoorSalesSQL } from "@dashboard-backend/core/sqlQueries";
const AWS = require('aws-sdk');
const csv = require('csv-parser');
const mysql = require('mysql2/promise');
const s3 = new AWS.S3();

function getUniqueEvents(arr: any[]) {
  const uniqueEvents:any = {};
  const result = [];
  
  for (let i = 0; i < arr.length; i++) {
    const eventId = arr[i].event_id;
    if (!uniqueEvents[eventId]) {
      uniqueEvents[eventId] = true;
      result.push(arr[i]);
    }
  }
  
  return result;
}

const mapAttendeesCsvValues = (row: any) => {
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

const mapEventsCsvValues = (row: any) => {
  const event_id = row['Event ID']
  const event_name = row['Event Name']
  const venue_name = row['Venue Name']

  return [ 
    event_id, 
    event_name, 
    venue_name
  ]
}

const mapOrdersCsvValues = (row: any) => {
  const order_num = row['Order #']
  const event_id = row['Event ID']
  const order_date = row['Order Date']
  const total_paid = row['Total Paid']
  const fees_paid = row['Fees Paid']
  const ticketing_platform_fees = row['Eventbrite Fees']
  const ticketing_platform_payment_processing_fees = row['Eventbrite Payment Processing']
  const order_type = row['Order Type']
  const order_notes = row['Order Notes']

  return [ 
    order_num, 
    event_id, 
    order_date,
    total_paid,
    fees_paid,
    ticketing_platform_fees,
    ticketing_platform_payment_processing_fees,
    order_type,
    order_notes
  ]
}

//Location,Dining Option,Customer ID,Customer Name,Customer Reference ID,Unit,Count,Itemization Type,Fulfillment Note
const mapSquareDoorSalesValues = (row: any) => {
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
  ]
}

export async function handler(event: any) {
  try {
    const eventData = event["Records"][0];
    const bucketName = eventData["s3"]["bucket"]["name"];
    const key = eventData["s3"]["object"]["key"];
    console.log(`key: ${key}`)

    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
      });

    const rows: any[] = [];

    await s3.getObject({ Bucket: bucketName, Key: key })
        .createReadStream()
        .pipe(csv())
        .on('data', (row: any) => {
            rows.push(row);
        }).on('end', async () => {                      
          if (key.includes("---Eventbrite")) {
            const attendeesValues = rows.map(mapAttendeesCsvValues);
            await connection.query(InsertAttendeesSQL, [attendeesValues])
            console.log('attendees inserted successfully')
            
            const eventsValues = rows.map(mapEventsCsvValues);
            const uniqueEventsValues = getUniqueEvents(eventsValues);
            await connection.query(InsertEventsSQL, [uniqueEventsValues])
            console.log('events inserted successfully')
            
            const ordersValues = rows.map(mapOrdersCsvValues);

            await connection.query(InsertOrdersSQL, [ordersValues])
            console.log('orders inserted successfully')     

          } else if(key.includes("---Square")) {
            const squareValues = rows.map(mapSquareDoorSalesValues);
            //InsertSquareDoorSalesSQL
            await connection.query(InsertSquareDoorSalesSQL, [squareValues])
            console.log('square_door_sales inserted successfully')   
          }
        })
    
    return {
      statusCode: 200,
      body: JSON.stringify(key)
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
      }),
    };
  }
};