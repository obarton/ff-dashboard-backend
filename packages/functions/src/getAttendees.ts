const mysql = require('mysql2/promise');

export async function handler(event: any) {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB,
    });
    
    const { queryStringParameters: { pageSize, pageNum, orderBy } } = event;
    console.log(`pageSize ${pageSize}`)
    console.log(`pageNum ${pageNum}`)

    var numRows;
    var queryPagination;
    var numPerPage = parseInt(pageSize, 10) || 1;
    var page = parseInt(pageNum, 10) || 0;
    var numPages;
    var skip = page * numPerPage;

    // Here we compute the LIMIT parameter for MySQL query
    var limit = skip + ',' + numPerPage;
    const pageLimitQuery = `SELECT COUNT(*) as unique_attendees_count FROM (
      SELECT *, COUNT(email) as total_orders FROM attendees
      GROUP BY email
  ) as unique_attendees`
    const [pageLimitData] = await connection.execute(pageLimitQuery);

    numRows = pageLimitData[0].unique_attendees_count;
    numPages = Math.ceil(numRows / numPerPage);
    console.log('pageLimitData:', JSON.stringify(pageLimitData));
    console.log('numRows:', JSON.stringify(numRows));
    console.log('numPages:', JSON.stringify(numPages));

    const paginatedAttendeeQuery = `SELECT *, COUNT(email) as total_orders FROM attendees
    GROUP BY email
    ORDER BY ${orderBy} DESC
    LIMIT ${limit}`;
    const [paginatedAttendeeData] = await connection.execute(paginatedAttendeeQuery);

    const totalResults = numRows;

    var responsePayload: any = {
      results: paginatedAttendeeData
    };

    if (page < numPages) {
      responsePayload.pagination = {
        totalResults,
        current: page,
        perPage: numPerPage,
        previous: page > 0 ? page - 1 : undefined,
        next: page < numPages - 1 ? page + 1 : undefined
      }
    }
    else responsePayload.pagination = {
      err: 'queried page ' + page + ' is >= to maximum page number ' + numPages
    }

    return {
      statusCode: 200,
      body: JSON.stringify(responsePayload),
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