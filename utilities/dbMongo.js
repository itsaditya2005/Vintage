const mongoose = require("mongoose");
require("dotenv").config();
const GlobalData = require("../modules/globalData");

const username = process.env.MONGO_USER //encodeURIComponent(process.env.MONGO_USER || '');//process.env.MONGO_USER
const passwordz = encodeURIComponent(process.env.MONGO_PASS || '');//process.env.MONGO_PASS 
const host = process.env.MONGO_HOST;
const port = process.env.MONGO_PORT;
const dbName = process.env.MONGO_DB;


const dbUrl =  process.env.MONGO_URL;

if (!dbUrl) {
    console.error("Error: MONGO_URL environment variable not set!");
    process.exit(1);
}

let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectInterval = 5000;

const connectWithRetry = async () => {
    try {
		
		console.log("dbUrl : ", dbUrl);
		
	
        await mongoose.connect(dbUrl, {
      socketTimeoutMS: 60000,
      serverSelectionTimeoutMS: 10000
      // No need for useUnifiedTopology anymore
    });
        reconnectAttempts = 0;
        console.log("✅ Connected to MongoDB using Mongoose!");
    } catch (error) {
        reconnectAttempts++;
        console.error(`❌ MongoDB connection failed (attempt ${reconnectAttempts}):`, error.message);
        if (reconnectAttempts <= maxReconnectAttempts) {
            console.log(`🔁 Retrying to connect in ${reconnectInterval / 1000} seconds...`);
            setTimeout(connectWithRetry, reconnectInterval);
        } else {
            console.error("🚫 Max reconnection attempts reached. Exiting process.");
            process.exit(1);
        }
    }
};

exports.connectToDatabase = connectWithRetry;

// Handle connection events
mongoose.connection.once("open", () => {
    console.log("🟢 MongoDB connection is open and ready");
});

mongoose.connection.on("connected", () => {
    console.log("🔁 MongoDB connected/reconnected");
});

mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
    connectWithRetry();
});

mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err);
});

exports.closeDatabaseConnection = async () => {
    try {
        await mongoose.connection.close();
        console.log("🔒 MongoDB (Mongoose) connection closed.");
    } catch (error) {
        console.error("Error closing MongoDB (Mongoose) connection:", error.message);
    }
};

exports.saveLog = async (data, model) => {
    try {
        const result = await model.insertMany(data);
        console.log("Log data saved successfully:");
        return result;
    } catch (error) {
        console.error("Error saving log data:", error.message);
        throw error;
    }
};

exports.addDatainGlobalmongo = async (ID, CATEGORY, TITLE, DATA, ROUTE, TERRITORY_ID) => {
    try {
        // No need to call connectToDatabase here.  It should be called once at app startup.
        const result = await GlobalData.findOneAndUpdate( // ... your existing findOneAndUpdate code
            { SOURCE_ID: ID, CATEGORY: CATEGORY },
            {
                $set: {
                    TITLE: TITLE,
                    DATA: DATA,
                    ROUTE: ROUTE,
                    TERRITORY_ID: TERRITORY_ID
                }
            },
            {
                upsert: true,
                new: true,
                runValidators: true
            }
        );

        if (!result) throw new Error("Failed to insert/update data: No result returned");
        console.log(result.isNew ? "Successfully inserted in globaldata" : "Successfully updated in globaldata");
    } catch (error) {
        console.error("Error during adding/updating global data", error);
        throw error; // Re-throw the error for proper handling
    }
};

exports.getDatabaseStatus = async () => {
    const state = mongoose.connection.readyState;
    const states = ["Disconnected", "Connected", "Connecting", "Disconnecting"];
    console.log(`MongoDB connection state: ${states[state]}`);
    return states[state];
};

process.on("SIGINT", async () => {
    await exports.closeDatabaseConnection();
    console.log("Application terminated gracefully.");
    process.exit(0);
});
