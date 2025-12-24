const baseURL = 'http://localhost:3000';
const token = `Bearer ${localStorage.getItem("token")}`;

if (!localStorage.getItem("token")) {
    window.location.href = './index.html';
}

const headers = {
    'Content-Type': 'application/json; charset=UTF-8',
    'authorization': token
};

let globalProfile = {};
let currentChatId = null; // To track active chat for "seen" and "typing"

const clintIo = io(baseURL, {
    auth: { authorization: token }
});

clintIo.on("connect", () => {
    console.log("Connected to Socket.IO");
});

clintIo.on("connect_error", (err) => {
    console.log("Connection failed:", err.message);
    if (err.message === "jwt expired" || err.message === "Authentication Error") {
        alert("Session expired. Please login again.");
        window.location.href = "./index.html";
    }
});

// --- Sound ---
const notifyAudio = new Audio('./sounds/notify.wav');

// --- Emitters & Listeners ---

// 1. Send Message
function sendMessage(targetId, type) {
    const input = document.getElementById("messageBody");
    const content = input.value.trim();
    if (!content) return;

    if (type === "ovo") {
        clintIo.emit('send-message', { content, sendTo: targetId });
    } else if (type === "group") {
        clintIo.emit('send-message', { content, sendTo: targetId }); // Backend handles both via same event now? No, let's check events. 
        // Docs say: emit 'send-message' with sendTo = targetId (User or Group ID).
    }
    input.value = '';
}

// 2. Receive My Own Message (Success)
clintIo.on('success-message', (data) => {
    console.log("Message Sent:", data);
    appendMessage(data.content, true, globalProfile?.picture?.url);
});

// 3. Receive New Message
clintIo.on("new-message", (data) => {
    console.log("New Message:", data);
    const { content, from, chatId, groupName } = data;

    // Is this message for the currently open chat?
    // If DM: chatId should match currentChatId? Or check from._id?
    // The backend sends 'chatId' in new-message. 
    // We should check if currentChatId === chatId.

    if (currentChatId === chatId) {
        // Active chat, append message
        const img = from.picture ? from.picture.url : './avatar/Avatar-No-Background.png';
        appendMessage(content, false, img);

        // Mark as seen immediately since we are looking at it
        clintIo.emit("message-seen", { chatId, messageId: data.messageId });
    } else {
        // Not active chat, show notification
        notifyAudio.play().catch(e => console.error(e));

        // Visual notification in list
        if (groupName) {
            $(`#g_${chatId}`).show(); // Show Green Dot for Group
        } else {
            $(`#c_${from._id}`).show(); // Show Green Dot for User (using from._id might be tricky if list uses friend ID)
            // Actually, if it's DM, the chatId is unique. But the list is composed of Friends.
            // We need to find the friend div. 
            $(`#c_${from._id}`).show();
        }
    }
});

// 4. Typing Indicators
let typingTimeout;
function handleTyping() {
    // Only for DMs for now based on backend support
    // We need receiverId. 
    // If we are in a group, backend typing support might be limited or broadcasted to group?
    // The backend `startWriting` takes `receiverId`. It emits to receiver sockets.
    // So good for DM.

    const sendBtn = document.getElementById("sendMessage");
    const onclickAttr = sendBtn.getAttribute("onclick");
    if (!onclickAttr) return;

    // Extract target ID
    const [_, targetId, type] = onclickAttr.match(/sendMessage\('([^']+)'\s*,\s*'([^']+)'\)/) || [];

    if (type === 'ovo' && targetId) {
        clintIo.emit('writing-start', { receiverId: targetId });

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            clintIo.emit('writing-stop', { receiverId: targetId });
        }, 1000);
    }
}

document.getElementById("messageBody").addEventListener("input", handleTyping);

clintIo.on("writing-start", (data) => {
    // data.senderId
    const { senderId } = data;
    // Show "typing..." near the user in the list OR in the header if open
    const headerName = document.getElementById("chatHeaderName");
    // Check if this user is currently open
    // We don't store "currentOpenUserId", only "currentChatId". 
    // Ideally we should match senderId to the open chat participants.

    // Simple UI update:
    if (document.querySelector(`.chatUser[data-id="${senderId}"]`)) {
        // Maybe show a small "..." icon?
    }
    console.log(`User ${senderId} is typing...`);
});

// --- UI Functions ---

function appendMessage(content, isMe, imgSrc) {
    const list = document.getElementById('messageList');
    const div = document.createElement('div');
    div.className = isMe ? 'me text-end p-2' : 'myFriend p-2';
    div.dir = isMe ? 'rtl' : 'ltr';

    const img = imgSrc || './avatar/Avatar-No-Background.png';

    div.innerHTML = `
        <img class="chatImage" src="${img}" alt="">
        <span class="mx-2">${content}</span>
    `;
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;

    // Remove "Say Hi" if present
    $(".noResult").hide();
}


// --- API Functions ---

// 1. Get Profile & Friends
function getUserData() {
    axios({
        method: 'get',
        url: `${baseURL}/users/profile`,
        headers
    }).then(function (response) {
        const { user, groups } = response.data?.data || {};
        globalProfile = user;

        document.getElementById("profileImage").src = user.picture?.url || './avatar/Avatar-No-Background.png';
        document.getElementById("userName").innerText = user.userName;

        showUsersData(user.friends);
        showGroupList(groups);
    }).catch(err => console.error(err));
}

function showUsersData(users = []) {
    let html = ``;
    users.forEach(u => {
        const img = u.picture?.url || './avatar/Avatar-No-Background.png';
        html += `
        <div onclick="displayChatUser('${u._id}', '${u.userName}')" class="chatUser my-2" data-id="${u._id}" style="cursor:pointer">
            <img class="chatImage" src="${img}">
            <span class="ps-2">${u.userName}</span>
            <span id="c_${u._id}" class="ps-2 closeSpan" style="display:none">🟢</span>
        </div>`;
    });
    document.getElementById('chatUsers').innerHTML = html;
}

function showGroupList(groups = []) {
    let html = ``;
    groups.forEach(g => {
        const img = g.group_image ? `${baseURL}/upload/${g.group_image}` : './avatar/Avatar-No-Background.png';
        html += `
        <div onclick="displayGroupChat('${g._id}', '${g.group}')" class="chatUser my-2" data-id="${g._id}" style="cursor:pointer">
            <img class="chatImage" src="${img}">
            <span class="ps-2">${g.group}</span>
            <span id="g_${g._id}" class="ps-2 closeSpan" style="display:none">🟢</span>
        </div>`;
    });
    document.getElementById('chatGrups').innerHTML = html;
}

// 2. Load 1-on-1 Chat
function displayChatUser(userId, userName) {
    currentChatId = null; // Reset first

    // UI Update
    document.getElementById('messageList').innerHTML = '<div class="text-center">Loading...</div>';
    document.getElementById("sendMessage").setAttribute("onclick", `sendMessage('${userId}' , "ovo")`);
    // Update Header (optional, usually implied by the list selection)

    $(`#c_${userId}`).hide(); // Hide notification

    axios({
        method: 'get',
        url: `${baseURL}/chat/${userId}?page=1&limit=50`, // Fixed Route
        headers,
    }).then(function (response) {
        const chat = response.data?.data?.chat;
        renderChatMessages(chat, globalProfile._id);

        if (chat) {
            currentChatId = chat._id;
            // Mark last message seen
            const lastMsg = chat.messages[chat.messages.length - 1];
            if (lastMsg && !lastMsg.seen && lastMsg.createdBy !== globalProfile._id) {
                clintIo.emit("message-seen", { chatId: chat._id, messageId: lastMsg._id });
            }
        }
    }).catch(function (error) {
        if (error.response?.status === 404) {
            // No chat yet
            renderChatMessages(null);
        } else {
            document.getElementById('messageList').innerHTML = '<div class="text-danger">Error loading chat</div>';
        }
    });
}

// 3. Load Group Chat
function displayGroupChat(groupId, groupName) {
    currentChatId = null;
    document.getElementById('messageList').innerHTML = '<div class="text-center">Loading...</div>';
    document.getElementById("sendMessage").setAttribute("onclick", `sendMessage('${groupId}' , "group")`);
    $(`#g_${groupId}`).hide();

    axios({
        method: 'get',
        url: `${baseURL}/chat/group/${groupId}?page=1&limit=50`,
        headers
    }).then(function (response) {
        const chat = response.data?.data?.chat;
        renderChatMessages(chat, globalProfile._id);
        if (chat) {
            currentChatId = chat._id;
            // Mark last message seen
            const lastMsg = chat.messages[chat.messages.length - 1];
            if (lastMsg && !lastMsg.seen && lastMsg.createdBy !== globalProfile._id) {
                clintIo.emit("message-seen", { chatId: chat._id, messageId: lastMsg._id });
            }
        }
    }).catch(function (error) {
        document.getElementById('messageList').innerHTML = '<div class="text-danger">Error loading group chat</div>';
    });
}

function renderChatMessages(chat, myId) {
    const list = document.getElementById('messageList');
    list.innerHTML = '';

    if (!chat || !chat.messages || chat.messages.length === 0) {
        list.innerHTML = `<div class="noResult text-center p-2"><span class="mx-2">Say Hi to start conversation.</span></div>`;
        return;
    }

    // Identify participants map for easy picture lookup
    const participantMap = {};
    if (chat.participants) {
        chat.participants.forEach(p => participantMap[p._id] = p);
    }

    chat.messages.forEach(msg => {
        const isMe = (msg.createdBy._id || msg.createdBy) === myId; // Handle populated vs unpopulated

        let imgSrc = './avatar/Avatar-No-Background.png';
        if (isMe) {
            imgSrc = globalProfile.picture?.url || imgSrc;
        } else {
            // Try to find sender in participants
            const senderId = msg.createdBy._id || msg.createdBy;
            if (participantMap[senderId] && participantMap[senderId].picture) {
                imgSrc = participantMap[senderId].picture.url;
            }
        }

        const div = document.createElement('div');
        div.className = isMe ? 'me text-end p-2' : 'myFriend p-2';
        div.dir = isMe ? 'rtl' : 'ltr';
        div.innerHTML = `
            <img class="chatImage" src="${imgSrc}">
            <span class="mx-2" title="${new Date(msg.createdAt).toLocaleString()}">${msg.content}</span>
        `;
        list.appendChild(div);
    });
    list.scrollTop = list.scrollHeight;
}

// Init
getUserData();