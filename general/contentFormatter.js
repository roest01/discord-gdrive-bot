// contentFormatter.js
// formatting content (e.g. date numbers)
// ==================


/**
 * Calculate the difference between given date and today
 * @private
 * @param {Date} date target date for calculating difference
 * @returns map with days, hours, minutes
 * @type Map with Number
 */
const dateDiff = (date) => {

    var days, hours, minutes;

    const today = new Date();

    var differenceTravel = today.getTime() - date.getTime();
    var totalMinutes = Math.floor((differenceTravel) / ((1000) * 60));
    minutes = totalMinutes % 60;
    days = (totalMinutes - (totalMinutes % (24 * 60))) / (24 * 60);
    hours = (totalMinutes - (24 * days * 60) - minutes) / 60;

    return {
        days: days,
        hours: hours,
        minutes: minutes
    };
}

/**
 * Convert date to string format
 * @param {Object} date input date which needs to be converted to string
 * @returns formated date based on locale
 * @type String
 */
const dateToString = (date, locale) => {
    let options = {   
        day: 'numeric',
        month: '2-digit', 
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    };

    return date.toLocaleDateString(locale, options);
}

// export
module.exports = {
    timeToNow: dateDiff,
    dateToString: dateToString
};