import mongoose from "mongoose";

export async function dbCon(){
    try {
       await mongoose.connect(`mongodb+srv://${process.env.MONGOUSER}:${process.env.MONGOPASS}@cluster0.evqepx3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)
        console.log("connected to mongodb sucessfully!")
    } catch (error) {
       console.log(error) 
    }
    
}