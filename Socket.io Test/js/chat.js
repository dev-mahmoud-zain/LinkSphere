const baseURL = 'http://localhost:3000'
const token = `Bearer ${localStorage.getItem("token")}`;

let globalProfile = {};

const headers = {
    'Content-Type': 'application/json; charset=UTF-8',
    'authorization': token
};

const clintIo = io(baseURL, {
    auth: { authorization: token }
})

clintIo.on("connect_error", (err) => {
    console.log("Connection failed:", err.message);
});

clintIo.on("custom_error", (err) => {
    console.log("custom_error:", err);
});

clintIo.on("like-post", data => {
    console.log({ likeData: data });
});

clintIo.on("offline-user", data => {
    console.log("offline-user",{ data });
});


clintIo.emit("message","Hello",(callBack)=>{
console.log(callBack)
})


// // clintIo.emit("sendMessage", { content: "FE need  profile", sendTo: "68c1bfd8f91ee1f635b7f799" })
// clintIo.on("profile", (data) => {
//     console.log(data);

// })



// clintIo.on("custom_connect_error", (err) => {
//     console.log(err);

//     console.log("Connection failed:", err.message);
// });

// clintIo.on("likePost", data => {
//     console.log({ data });

// })


//images links
let avatar = './avatar/Avatar-No-Background.png'
let meImage = './avatar/Avatar-No-Background.png'
let friendImage = './avatar/Avatar-No-Background.png'

//save socket id
// clintIo.emit("updateSocketId", { token })


// collect messageInfo
function sendMessage(sendTo, type) {
    console.log({ sendTo, type });

    if (type == "ovo") {
        
        const data = {
            content: $("#messageBody").val(),
            sendTo,
        }

        clintIo.emit('send-message', data)

    } else if (type == "group") {
        const data = {
            content: $("#messageBody").val(),
            groupId: sendTo,
        }
        clintIo.emit('sendGroupMessage', data)
    }

}

// //sendCompleted
clintIo.on('success-message', (data) => {

    const { content } = data

    const div = document.createElement('div');

    div.className = 'me text-end p-2';
    div.dir = 'rtl';
    const imagePath = globalProfile.picture ? globalProfile.picture.url : avatar
    div.innerHTML = `
    <img class="chatImage" src="${imagePath}" alt="" srcset="">
    <span class="mx-2">${content}</span>
    `;
    document.getElementById('messageList').appendChild(div);
    $(".noResult").hide()
    $("#messageBody").val('')
})

// // //receiveMessage
clintIo.on("new-message", (data) => {

    console.log({ RM: data });
    const { content, from, groupId } = data
    console.log({ from });

    let imagePath = avatar;
    if (from?.picture) {
        imagePath = from.picture.url
    }

    const onclickAttr = document.getElementById("sendMessage").getAttribute("onclick")
    const [base, currentOpenedChat] = onclickAttr?.match(/sendMessage\('([^']+)'/) || [];
    console.log({ currentOpenedChat });
    console.log({ onclickAttr, currentOpenedChat });

    if ((!groupId && currentOpenedChat === from._id) || (groupId && currentOpenedChat === groupId)) {
        const div = document.createElement('div');
        div.className = 'myFriend p-2';
        div.dir = 'ltr';
        div.innerHTML = `
    <img class="chatImage" src="${imagePath}" alt="" srcset="">
    <span class="mx-2">${content}</span>
    `;
        document.getElementById('messageList').appendChild(div);
    } else {

        if (groupId) {
            $(`#g_${groupId}`).show();
        } else {
            $(`#c_${from._id}`).show();

        }
        const audio = document.getElementById("notifyTone");
        audio.currentTime = 0; // restart from beginning
        audio.play().catch(err => console.log("Audio play blocked:", err));
    }
})

// // ******************************************************************** Show chat conversation
function showData(sendTo, chat) {
    document.getElementById("sendMessage").setAttribute("onclick", `sendMessage('${sendTo}' , "ovo")`);

    document.getElementById('messageList').innerHTML = ''
    if (chat.messages?.length) {
        $(".noResult").hide()
        for (const message of chat.messages) {

            if (message.createdBy.toString() == globalProfile._id.toString()) {
                const div = document.createElement('div');
                div.className = 'me text-end p-2';
                div.dir = 'rtl';
                div.innerHTML = `
                <img class="chatImage" src="${meImage}" alt="" srcset="">
                <span class="mx-2">${message.content}</span>
                `;
                document.getElementById('messageList').appendChild(div);
            } else {
                const div = document.createElement('div');
                div.className = 'myFriend p-2';
                div.dir = 'ltr';
                div.innerHTML = `
                <img class="chatImage" src="${friendImage}" alt="" srcset="">
                <span class="mx-2">${message.content}</span>
                `;
                document.getElementById('messageList').appendChild(div);
            }

        }
    } else {
        const div = document.createElement('div');

        div.className = 'noResult text-center  p-2';
        div.dir = 'ltr';
        div.innerHTML = `
        <span class="mx-2">Say Hi to start the conversation.</span>
        `;
        document.getElementById('messageList').appendChild(div);
    }

    $(`#c_${sendTo}`).hide();


}

// //get chat conversation between 2 users and pass it to ShowData fun
function displayChatUser(userId) {

    axios({
        method: 'get',
        url: `${baseURL}/users/${userId}/chat?page=1&limit=5`,
        headers,
    }).then(function (response) {
        const { chat } = response.data?.data

        if (chat) {

            if (chat.participants[0]._id.toString() === globalProfile._id.toString()) {
                meImage = chat.participants[0].picture ? chat.participants[0].picture.url : avatar
                friendImage = chat.participants[1].picture? chat.participants[1].picture.url : avatar
            } else {
                friendImage = chat.participants[0].picture? chat.participants[0].picture.url : avatar
                meImage = chat.participants[1].picture ? chat.participants[1].picture .url: avatar
            }

            showData(userId, chat)
        } else {
            showData(userId, 0)
        }

    }).catch(function (error) {
        console.log(error);
        console.log({ status: error.status });
        if (error.status == 404) {
            showData(userId, 0)
        } else {
            alert("Ops something went wrong")
        }

    });
}

// // ********************************************************************
// // ******************************************************************** Show  group chat conversation
function showGroupData(sendTo, chat) {
    document.getElementById("sendMessage").setAttribute("onclick", `sendMessage('${sendTo}' , "group")`);

    document.getElementById('messageList').innerHTML = ''
    if (chat.messages?.length) {
        $(".noResult").hide()
        console.log(chat.messages);

        for (const message of chat.messages) {

            if (message.createdBy?._id.toString() == globalProfile._id.toString()) {
                const div = document.createElement('div');
                div.className = 'me text-end p-2';
                div.dir = 'rtl';
                div.innerHTML = `
                <img class="chatImage" src="${meImage}" alt="" srcset="">
                <span class="mx-2">${message.content}</span>
                `;
                document.getElementById('messageList').appendChild(div);
            } else {

                const div = document.createElement('div');
                div.className = 'myFriend p-2';
                div.dir = 'ltr';
                const friendImage = message.createdBy.profilePicture ? `${baseURL}/upload/${message.createdBy.profilePicture}` : avatar
                div.innerHTML = `
                <img class="chatImage" src="${friendImage}" alt="" srcset="">
                <span class="mx-2">${message.content}</span>
                `;
                document.getElementById('messageList').appendChild(div);
            }

        }
    } else {
        const div = document.createElement('div');

        div.className = 'noResult text-center  p-2';
        div.dir = 'ltr';
        div.innerHTML = `
        <span class="mx-2">Say Hi to start the conversation.</span>
        `;
        document.getElementById('messageList').appendChild(div);
    }
    $(`#g_${sendTo}`).hide();


}
// // ********************************************************************
function displayGroupChat(groupId) {
    console.log({ groupId });
    axios({
        method: 'get',
        url: `${baseURL}/chat/group/${groupId}`,
        headers
    }).then(function (response) {
        const { chat } = response.data?.data
        console.log({ chat });
        if (chat) {
            meImage = globalProfile.profilePicture ? `${baseURL}/upload/${globalProfile.profilePicture}` : avatar
            showGroupData(groupId, chat)
        } else {
            showGroupData(groupId, 0)
        }

    }).catch(function (error) {
        console.log(error);
        console.log({ status: error.status });
        if (error.status == 404) {
            showGroupData(groupId, 0)
        } else {
            alert("Ops something went wrong")
        }

    });
}
// ==============================================================================================


// ********************************************************* Show Users list 
// Display Users
function getUserData() {
    axios({
        method: 'get',
        url: `${baseURL}/users/profile`,
        headers
    }).then(function (response) {
        console.log({ D: response.data });

        const { user, groups } = response.data?.data;

        console.log({ user });

        globalProfile = user;

        // Default avatar
        let imagePath = avatar;

        // Set correct user picture
        if (user.picture?.url) {
            imagePath = user.picture.url;
        }

        document.getElementById("profileImage").src = imagePath;

        // Username from API
        document.getElementById("userName").innerHTML = user.userName;

        // Friends list
        showUsersData(user.friends);

        // Groups list
        showGroupList(groups);

    }).catch(function (error) {
        console.log(error);
    });
}

// Show friends list
function showUsersData(users = []) {
    let cartonna = ``;

    for (let i = 0; i < users.length; i++) {
        let imagePath = avatar;

        // لو فيه صورة
        if (users[i].picture?.url) {
            imagePath = users[i].picture.url;
        }

        cartonna += `
        <div onclick="displayChatUser('${users[i]._id}')" class="chatUser my-2">
            <img class="chatImage" src="${imagePath}" alt="">
            <span class="ps-2">${users[i].userName}</span>
            <span id="c_${users[i]._id}" class="ps-2 closeSpan">
                🟢
            </span>
        </div>
        `;
    }

    document.getElementById('chatUsers').innerHTML = cartonna;
}

// Show groups list
function showGroupList(groups = []) {
    let cartonna = ``
    for (let i = 0; i < groups.length; i++) {
        let imagePath = avatar;
        if (groups[i].group_image) {
            imagePath = `${baseURL}/upload/${groups[i].group_image}`
        }
        cartonna += `
        <div onclick="displayGroupChat('${groups[i]._id}')" class="chatUser my-2">
        <img class="chatImage" src="${imagePath}" alt="" srcset="">
        <span class="ps-2">${groups[i].group}</span>
           <span id="${"g_" + groups[i]._id}" class="ps-2 closeSpan">
           🟢
        </span>
    </div>
        
        `
        clintIo.emit("join_room", { roomId: groups[i].roomId })

    }


    document.getElementById('chatGrups').innerHTML = cartonna;
}
getUserData()
// ********************************************************* Show Users list