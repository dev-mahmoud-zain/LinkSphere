
const access_token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OGYwMGJkODE2YjNhYzc3ODJjZDkyNzgiLCJyb2xlIjoidXNlciIsImlhdCI6MTc2NDM0Mjk1NCwiZXhwIjoxNzY0MzQ2NTU0LCJqdGkiOiJmZDE1NmQzMy1mNDUxLTQ5NTItYmZhYi1kZGYwNjQwMTc4MzEifQ.NO2MN_-X3HBFoaqLONZPa8p_xFoa3HZbZKnJyfNAyG8"

const ClientIo = io("http://localhost:3000/",{
    auth:{authorization:access_token}
});

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

ClientIo.on("connect_error",(error)=>{
    console.error(error);
})