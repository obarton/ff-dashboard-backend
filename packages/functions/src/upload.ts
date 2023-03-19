
import { 
  InsertAttendeesSQL, 
  InsertEventsSQL, 
  InsertOrdersSQL, 
  InsertSquareDoorSalesSQL, 
  InsertSocialReachFacebookSQL, 
  InsertSocialProfileVisitsFacebookSQL
} from "@dashboard-backend/core/sqlQueries";
import { 
  mapAttendeesCsvValues, 
  mapEventsCsvValues, 
  mapOrdersCsvValues, 
  mapSquareDoorSalesCsvValues, 
  mapFacebookReachCsvValues, 
  mapFacebookProfileVisitsCsvValues
} from "@dashboard-backend/core/csv";
import { convertDateToMysqlFormat } from "@dashboard-backend/core/date";

const AWS = require('aws-sdk');
const csv = require('csv-parser');
const iconv = require('iconv-lite');
const mysql = require('mysql2/promise');
const s3 = new AWS.S3();

function getUniqueEvents(arr: any[]) {
  const eventsDictionary:any = {};
  
  for (let i = 0; i < arr.length; i++) {
    const eventData = arr[i];
    const eventId = eventData[0];

    if (!eventsDictionary.hasOwnProperty(eventId)) {
      eventsDictionary[eventId] = eventData;
    }
  }
  
  return Object.values(eventsDictionary);
}

const uploadEventbriteData = async (rows: any, connection: any) => {
  const attendeesValues = rows.map(mapAttendeesCsvValues);
  await connection.query(InsertAttendeesSQL, [attendeesValues])
  console.log('attendees inserted successfully')
  
  const eventsValues = rows.map(mapEventsCsvValues);
  const uniqueEventsValues = getUniqueEvents(eventsValues);
  console.log(`unique events values ${uniqueEventsValues}`);
  await connection.query(InsertEventsSQL, [uniqueEventsValues])
  console.log('events inserted successfully')
  
  const ordersValues = rows.map(mapOrdersCsvValues);

  await connection.query(InsertOrdersSQL, [ordersValues])
  console.log('orders inserted successfully')  
}

const uploadSquareData = async (rows: any, connection: any) => {
  const squareValues = rows.map(mapSquareDoorSalesCsvValues);
  await connection.query(InsertSquareDoorSalesSQL, [squareValues])
  console.log('square_door_sales inserted successfully') 
}

const uploadFacebookReachData = async (rows: any, connection: any) => {
  const parsedCsvReachData = rows.map(mapFacebookReachCsvValues);

  const nonNullReachData = parsedCsvReachData.filter((el: any) => el);
  const [facebookReachData, instagramReachData] = splitArray(nonNullReachData)
  const cleanedFacebookReachData = facebookReachData.filter(f => f.reach != "Facebook Page reach" && f.date != "Instagram reach").filter(e => Object.keys(e).length != 0)
  const clearnedInstagramReachData = instagramReachData.filter(e => Object.keys(e).length != 0)

  const facebookReachValues = cleanedFacebookReachData.map(e => {
    const { date, reach } = e;
    const platform = "facebook";

    if (date) {
      const dbRow = [
        convertDateToMysqlFormat(date),
        reach,
        platform
      ] 
      return dbRow;
    }
  })

    const instagramReachValues = clearnedInstagramReachData.map(e => {
    const { date, reach } = e;
    const platform = "instagram";

    if (date) {
      const dbRow = [
        convertDateToMysqlFormat(date),
        reach,
        platform
      ] 
      return dbRow;
    }
  })

  const socialReachValues = [...facebookReachValues, ...instagramReachValues].filter(n => n);
  console.log(`socialReachValues ${JSON.stringify(socialReachValues, null, 2)}`) 

  await connection.query(InsertSocialReachFacebookSQL, [socialReachValues])
  console.log('social_reach_facebook inserted successfully') 
}

const uploadFacebookProfileVisitsData = async (rows: any, connection: any) => {
  const parsedCsvProfileVisitsData = rows.map(mapFacebookProfileVisitsCsvValues);

  const nonNullProfileVisitsData = parsedCsvProfileVisitsData.filter((el: any) => el);
  const [facebookProfileVisitsData, instagramProfileVisitsData] = splitProfileVisitsArray(nonNullProfileVisitsData)
  const cleanedFacebookProfileVisitsData = facebookProfileVisitsData.filter(f => f.profile_visits != "Facebook Page likes" && f.date != "Instagram profile visits").filter(e => Object.keys(e).length != 0)
  const clearnedInstagramProfileVisitsData = instagramProfileVisitsData.filter(e => Object.keys(e).length != 0)

  console.log(`cleanedFacebookProfileVisitsData ${JSON.stringify(cleanedFacebookProfileVisitsData, null, 2)}`)
  console.log(`clearnedInstagramProfileVisitsData ${JSON.stringify(clearnedInstagramProfileVisitsData, null, 2)}`)

  const facebookProfileVisitsValues = cleanedFacebookProfileVisitsData.map(e => {
    const { date, profile_visits } = e;
    const platform = "facebook";

    if (date) {
      const dbRow = [
        convertDateToMysqlFormat(date),
        profile_visits,
        platform
      ] 
      return dbRow;
    }
  })

    const instagramProfileVisitsValues = clearnedInstagramProfileVisitsData.map(e => {
    const { date, profile_visits } = e;
    const platform = "instagram";

    if (date) {
      const dbRow = [
        convertDateToMysqlFormat(date),
        profile_visits,
        platform
      ] 
      return dbRow;
    }
  })

  const socialProfileVisitsValues = [...facebookProfileVisitsValues, ...instagramProfileVisitsValues].filter(n => n);
  console.log(`socialProfileVisitsValues ${JSON.stringify(socialProfileVisitsValues, null, 2)}`) 

  await connection.query(InsertSocialProfileVisitsFacebookSQL, [socialProfileVisitsValues])
  console.log('social_profile_visits_facebook inserted successfully') 
}

function splitArray(arr: any[]) {
  const index = arr.findIndex((el: any) => el.reach === "Instagram reach");
  const before = arr.slice(0, index);
  const after = arr.slice(index + 1);
  return [before, after];
}

function splitProfileVisitsArray(arr: any[]) {
  const index = arr.findIndex((el: any) => el.profile_visits === "Instagram followers");
  const before = arr.slice(0, index);
  const after = arr.slice(index + 1);
  return [before, after];
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

    if (key.includes("---Eventbrite") || key.includes("---Square")) {
      await s3.getObject({ Bucket: bucketName, Key: key })
      .createReadStream()
      .pipe(csv())
      .on('data', (row: any) => {
          rows.push(row);
      }).on('end', async () => {                      
        if (key.includes("---Eventbrite")) 
        {   
          await uploadEventbriteData(rows, connection)
        } 
        else if(key.includes("---Square")) 
        {      
          await uploadSquareData(rows, connection)
        } 
      })
    } else if (key.includes("---FacebookReach")) {
      await s3.getObject({ Bucket: bucketName, Key: key })
      .createReadStream()
      .pipe(iconv.decodeStream('utf16-le'))
      .pipe(csv({
        skipLines: 1,
        headers: ["Date", "Reach"]
      }))
      .on('data', (row: any) => {
          rows.push(row);
      }).on('end', async () => {                      
        await uploadFacebookReachData(rows, connection)    
      })
    } else if (key.includes("---FacebookProfileVisits")) {
      await s3.getObject({ Bucket: bucketName, Key: key })
      .createReadStream()
      .pipe(iconv.decodeStream('utf16-le'))
      .pipe(csv({
        skipLines: 1,
        headers: ["Date", "ProfileVisits"]
      }))
      .on('data', (row: any) => {
          rows.push(row);
      }).on('end', async () => {                      
        await uploadFacebookProfileVisitsData(rows, connection)    
      })
    }


    
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