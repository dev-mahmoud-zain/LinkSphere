import { connect } from "mongoose";
import { UserModel } from "./models/user.model";


const connectToDataBase = async (): Promise<void> => {

    try {
        await connect(process.env.DB_CONNECTION_URL as string);
        
        UserModel.syncIndexes();

        console.log("DataBase Connected Success");
    } catch (error) {
        console.log("\nX X X X X X X X X X X X X X X X X X X X X X X");
        console.log("Faild To Connect DataBase");
        console.log("X X X X X X X X X X X X X X X X X X X X X X X\n");
        console.log(error)
    }

}

export default connectToDataBase;