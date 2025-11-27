const ClientIo = io("http://localhost:3000/");

// ClientIo.emit("message", "Hello From FE To BE", (response) => {
//   console.log(response);
// });

ClientIo.on("commented-on-post", (callBack) => {
  try {
    console.log(callBack);
  } catch (error) {
    console.log(error);
  }
});
