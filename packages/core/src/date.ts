const moment = require ("moment");

export const parseDateAttending = (dateAttendingString: string): string => {
    const [date, time] = dateAttendingString.split(" at ");
    const [hour, minutes] = time.split(" ")[0].trim().split(":");
    const period = time.split(" ")[1].trim();
  
    let hourInt = parseInt(hour);
    if (period === "PM" && hourInt !== 12) {
        hourInt += 12;
    }
    else if (period === "AM" && hourInt === 12) {
        hourInt = 0;
    }
  
    const dateTimeAttending = new Date(`${date} ${hourInt}:${minutes}:00`);
    return moment(dateTimeAttending).format("YYYY-MM-DD HH:mm:ss");
  };
  
export const convertDateToMysqlFormat = (dateStr: string) => {
    if (dateStr === "" || dateStr === null) {
      return "";
    }
  
    // Parse the input date string using Date() constructor
    const dateObj = new Date(dateStr);
    
    // Extract the year, month, day, hour, and minute from the date object
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1; // Month is 0-indexed in Date()
    const day = dateObj.getDate();
    const hour = dateObj.getHours();
    const minute = dateObj.getMinutes();
    
    // Pad single-digit values with a leading zero
    const padZero = (value: any) => value.toString().padStart(2, '0');
    
    // Combine the values into a MySQL-formatted datetime string
    const datetimeStr = `${year}-${padZero(month)}-${padZero(day)} ${padZero(hour)}:${padZero(minute)}:00`;
    
    return datetimeStr;
  }