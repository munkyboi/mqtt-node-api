const state = {
  lastMessageAt: null,
  lastInsertId: null,
  lastRelayCommand: null,
  lastDeviceStatus: null,
};

function markLastMessageAt(date = new Date()) {
  state.lastMessageAt = date;
}

function setLastInsertId(id) {
  state.lastInsertId = id;
}

function setLastRelayCommand(command) {
  state.lastRelayCommand = {
    ...command,
    sent_at: command.sent_at.toISOString(),
  };
}

function setLastDeviceStatus(statusEvent) {
  state.lastDeviceStatus = {
    ...statusEvent,
    updated_at: statusEvent.updated_at.toISOString(),
  };
}

function getState() {
  return { ...state };
}

module.exports = {
  markLastMessageAt,
  setLastInsertId,
  setLastRelayCommand,
  setLastDeviceStatus,
  getState,
};
