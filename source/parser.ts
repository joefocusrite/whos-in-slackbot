import {allLocations, Command, CommandType, Location} from './command';

const getAliases = (location: Location): Array<string> => {
  switch (location) {
    case 'Remote':
      return ['remote', 'wfh', 'working from home', 'home'];
    case 'Tileyard':
      return ['ty', 'tileyard', 'london', 'ampify', 'big smoke'];
    case 'HQ':
      return ['hq', 'high wycombe', 'hw', 'wycombe'];
  }
};

const getMonth = (token: string): number | undefined => {
  const months = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
  ];

  let month = undefined;

  months.forEach((m, index) => {
    if (token.toLowerCase().startsWith(m)) {
      month = index;
    }
  });

  return month;
};

const getDate = (tokens: Array<string>): Date | undefined => {
  const datePattern = /^([1-3]?[0-9])(st|nd|rd|th)?$/;

  let day: number | undefined = undefined;
  let month: number | undefined = undefined;
  let fullDate: Date | undefined = undefined;

  tokens.forEach((token) => {
    const parsed = Date.parse(token);
    if (parsed > 0) {
      fullDate = new Date(parsed);
    }

    const matches = datePattern.exec(token);
    if (matches) {
      day = parseInt(matches[1]);
    }

    const m = getMonth(token);
    if (m !== undefined) {
      month = m;
    }
  });

  if (typeof fullDate === 'object') {
    return fullDate;
  }

  if (typeof day === 'number' && typeof month === 'number') {
    const date = new Date();
    date.setMonth(month);
    date.setDate(day);

    while (date.getTime() < new Date().getTime()) {
      date.setFullYear(date.getFullYear() + 1);
    }

    return date;
  }

  return undefined;
};

const getType = (
  tokens: Array<string>,
  date?: Date,
  location?: Location,
  otherUser?: string
): CommandType | undefined => {
  if (tokens.find((token) => token.toLowerCase() === 'default') && location) {
    return 'update-default';
  }

  if (
    tokens.find((token) => token.toLowerCase() === 'subscribe') &&
    otherUser
  ) {
    return 'subscribe-to-user';
  }

  if (
    tokens.find(
      (token) =>
        token.toLowerCase() === "who's" || token.toLowerCase() === 'who'
    ) &&
    location
  ) {
    return 'get-location';
  }

  if (date && location) {
    return 'update-location';
  }

  if (otherUser) {
    return 'get-user-location';
  }

  return undefined;
};

const getLocation = (tokens: Array<string>): Location | undefined => {
  let foundLocation = undefined;

  tokens.forEach((token) => {
    allLocations.forEach((location) => {
      if (token.toLowerCase() === location.toLowerCase()) {
        foundLocation = location;
      }

      const aliases = getAliases(location);
      aliases.forEach((alias) => {
        if (token.toLowerCase() === alias.toLowerCase()) {
          foundLocation = location;
        }
      });
    });
  });

  return foundLocation;
};

const BOT_ID = 'U04241SDADB';

const getUser = (tokens: Array<string>): string | undefined => {
  const pattern = /^<@(\w*).*>$/;

  const users = tokens
    .map((token) => {
      const matches = pattern.exec(token);
      return matches ? matches[1] : null;
    })
    .filter(Boolean)
    .filter((user) => user !== BOT_ID);

  if (users.length > 0 && users[0]) {
    return users[0];
  }

  return undefined;
};

export const parseRequest = (request: string, user: string): Command | null => {
  let tokens = request.split(' ');

  const date = getDate(tokens);
  const location = getLocation(tokens);
  const otherUser = getUser(tokens);
  const type = getType(tokens, date, location, otherUser);

  if (type) {
    return {
      user,
      type,
      location,
      date,
      otherUser,
    };
  }

  return null;
};
