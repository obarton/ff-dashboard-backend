const AWS = require('aws-sdk');
const csv = require('csv-parser');
const mysql = require('mysql2/promise');
const s3 = new AWS.S3();

export async function handler(event: any) {
  try {
    const eventData = event["Records"][0];
    const bucketName = eventData["s3"]["bucket"]["name"];
    const key = eventData["s3"]["object"]["key"];

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
            const query = `INSERT INTO ticket 
            (
                event_id, 
                attendee_id, 
                ticket_type_id, 
                ticket_order_type_id, 
                ticket_status_id, 
                quantity, 
                price, 
                purchase_date, 
                check_in_date
            ) VALUES ?`
            
            const values = rows.map((row) => {
                /* TODO: Derive Relational IDs */
                const eventId = 1 //row['Event ID']
                const attendeeId = 1 //row['Email']
                const ticketTypeId = 1 //row['Ticket Type']
                const ticketOrderTypeId = 1 //row['Order Type']
                const ticketStatusId = 1 //row['Attendee Status']
                const quantity = row['Quantity']
                const price = row['Total Paid']
                const purchaseDate = row['Order Date']
                const checkInDate = row['Check In Date'] ?? null

                return [eventId, attendeeId, ticketTypeId, ticketOrderTypeId, ticketStatusId, quantity, price, purchaseDate, checkInDate]
            });

            await connection.query(query, [values])
            console.log('Data inserted successfully')
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