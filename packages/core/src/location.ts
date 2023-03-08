export const parseEventbriteLocationCity = (locationString : string) => {
    const locationStringArray = locationString.split(', ');
    
    return locationStringArray.length === 3 ? locationStringArray[0] : "";
  }
  
  export const parseEventbriteLocationState = (locationString : string) => {
    const locationStringArray = locationString.split(', ');
  
    switch (locationStringArray.length) {
        case 3:
            return locationStringArray[1]
        case 2:
            return locationStringArray[0]
        default:
            return "";
    }
  }
  
  export const parseEventbriteLocationCountry = (locationString : string) => {
    if (locationString === "Unknown Location") {
      return "";
    }
  
    const locationStringArray = locationString.split(', ');
  
    switch (locationStringArray.length) {
        case 3:
            return locationStringArray[2]
        case 2:
            return locationStringArray[1]
        case 1:
            return locationStringArray[0]
        default:
            return "";
    }
  }
  