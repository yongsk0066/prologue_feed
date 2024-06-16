export const addLeadingZero = (num: number) => num.toString().padStart(2, '0');

export const buildRFC822Date = (dateString: string) => {
  const dayStrings = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthStrings = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const date = new Date(Date.parse(dateString));

  const day = dayStrings[date.getDay()];
  const dayNumber = addLeadingZero(date.getDate());
  const month = monthStrings[date.getMonth()];
  const year = date.getFullYear();
  const time = `${addLeadingZero(date.getHours())}:${addLeadingZero(date.getMinutes())}:00`;
  const timezone = 'GMT';

  return `${day}, ${dayNumber} ${month} ${year} ${time} ${timezone}`;
};
