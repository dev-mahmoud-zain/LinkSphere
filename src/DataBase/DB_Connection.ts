import mongoose from "mongoose";

const uri = process.env.DB_CONNECTIONSTRING || ""

 const connectToDataBase = async () => {

    try {
        await mongoose.connect(uri)
        console.log("DataBase Connected Succses");
    } catch (error) {
        console.log("Faild To Connect DataBase");
        console.log(error)
    }

}

export default connectToDataBase