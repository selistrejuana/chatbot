const qrcode = require("qrcode-terminal");
const MESSAGES = require("./constants/messages.json");
const { Client } = require("whatsapp-web.js");
const client = new Client();

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Client is ready!");
});

client.initialize();

let users = [];

const delay = (delayInms) => {
  return new Promise((resolve) => setTimeout(resolve, delayInms));
};

const attStageUser = (user, message) => {
  const usersFiltered = users.filter(
    (userFiltered) => userFiltered.id !== user.id
  );
  let newStageOne = user.stageOne;
  let newStageTwo = user.stageTwo;
  let newStageThree = user.stageThree;

  if (!user.stageOne && !user.stageTwo) {
    newStageOne = 1;
  } else if (!user.stageTwo && message.body === "1" && !user.stageThree) {
    newStageTwo = 1;
  } else if (!user.stageTwo && message.body === "2" && !user.stageThree) {
    newStageTwo = 2;
  } else if (!user.stageTwo && message.body === "3" && !user.stageThree) {
    newStageTwo = 3;
  } else if (!user.stageTwo && message.body === "4" && !user.stageThree) {
    newStageTwo = 4;
  } else if (user.stageTwo === 2 && message.body === "1") {
    newStageThree = 1;
  } else if (user.stageTwo === 2 && message.body === "2") {
    newStageThree = 2;
  } else if (user.stageTwo === 2 && message.body === "3") {
    newStageThree = null;
    newStageTwo = null;
  } else if (
    user.stageTwo === 1 &&
    user.stageTwo === 1 &&
    message.body === "1"
  ) {
    newStageThree = null;
    newStageTwo = null;
  }

  users = [
    ...usersFiltered,
    {
      ...getUser(user.id),
      stageOne: newStageOne,
      stageTwo: newStageTwo,
      stageThree: newStageThree,
    },
  ];
};

const verifyTimeUsers = () => {
  users = users.filter((user) => user.lastMessage + 300000 >= Date.now());
};

const getUser = (userId) => {
  return users.find((user) => userId === user.id);
};

const setBlocked = (user) => {
  const usersFiltered = users.filter(
    (userFiltered) => userFiltered.id !== user.id
  );
  users = [...usersFiltered, { ...user, blocked: true }];
};

const setUser = (userId) => {
  const user = users.find((user) => user.id === userId);
  if (user) {
    users.filter((user) => user.id !== userId);
    users = [...users, { ...user, lastMessage: Date.now() }];
  } else {
    users = [
      ...users,
      {
        id: userId,
        stageOne: null,
        stageTwo: null,
        lastMessage: Date.now(),
        blocked: false,
      },
    ];
  }
};

setInterval(verifyTimeUsers, 2000);

client.on("message", async (message) => {
  setUser(message.from);
  if (!getUser(message.from)?.stageOne) {
    client.sendMessage(message.from, MESSAGES.FIRST.MESSAGE);
    client.sendMessage(message.from, MESSAGES.SECOND.MESSAGE);
    await delay(2000);
  }

  attStageUser(getUser(message.from), message);

  if (
    getUser(message.from)?.stageTwo &&
    !getUser(message.from)?.stageThree &&
    !getUser(message.from).blocked
  ) {
    client.sendMessage(
      message.from,
      MESSAGES["1"][getUser(message.from)?.stageTwo].MESSAGE
    );
    client.sendMessage(
      message.from,
      MESSAGES["1"][getUser(message.from)?.stageTwo].SECOND_MESSAGE
    );
  } else if (
    getUser(message.from)?.stageThree &&
    !getUser(message.from).blocked
  ) {
    client.sendMessage(
      message.from,
      MESSAGES["1"][getUser(message.from)?.stageTwo][
        getUser(message.from)?.stageThree
      ].MESSAGE
    );
    setBlocked(getUser(message.from));
  } else if (
    getUser(message.from)?.stageOne &&
    !getUser(message.from)?.stageThree &&
    !getUser(message.from).blocked
  ) {
    client.sendMessage(
      message.from,
      MESSAGES[getUser(message.from)?.stageOne].MESSAGE
    );
  }

  if (
    getUser(message.from).stageOne === 1 &&
    (getUser(message.from).stageTwo === 3 ||
      getUser(message.from).stageTwo === 4)
  ) {
    setBlocked(getUser(message.from));
  }
});
