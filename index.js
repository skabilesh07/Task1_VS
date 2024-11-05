import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import mongodb from "mongodb";

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

var MongoClient = mongodb.MongoClient;
var url = "mongodb://0.0.0.0:27017/";
const databasename = "VIZIONSYS";
app.use(express.static("public"));

mongoose.connect("mongodb://0.0.0.0:27017/VIZIONSYS")
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
    });

const formdataSchema = new mongoose.Schema({
    BranchName: { type: String, required: true },
    Dependency: { type: String, required: true },
    ChangeLog: { type: String, required: true },
    TicketID: { type: String, required: true },
    DeveloperName: { type: String, required: true },
});

// updated schema

const updatedschema = new mongoose.Schema({
    BranchName: { type: String, required: true },
    Dependency: { type: String, required: true },
    ChangeLog: { type: String, required: true },
    TicketID: { type: String, required: true },
    DeveloperName: { type: String, required: true },
    IsApproved: { type: Boolean, required: true },
    IsPublished: { type: Boolean, required: true },
});

// is approved(bool), published(bool), version numbeer
const FormData = mongoose.model("FormData", formdataSchema);

// updated model
const Updatedmodel = mongoose.model("updatedform", updatedschema);

app.get("/", (req, res) => {
    res.redirect("/display");
    res.render("open", { users: [] }); // Pass an empty array for 'users'
});

// for approved

app.post("/approved", async (req, res) => {
    const selectedUsers = req.body.selectedUsers;
    const action = req.body.action; // Get the action from the form submission

    // Check if any users are selected
    if (!selectedUsers || selectedUsers.length === 0) {
        console.log("No users selected.");
        return res.send("No users selected.");
    }

    // Log the selected user IDs and action
    console.log("Selected User IDs:", selectedUsers);
    console.log("Action:", action);

    try {
        // Determine the update based on the action
        let update = {};
        if (action === "approve") {
            update = { IsApproved: true };
        } else if (action === "publish") {
            update = { IsPublished: true };
        }

        // Update the selected users based on the action
        await Updatedmodel.updateMany(
            { _id: { $in: selectedUsers } }, // Select users with the IDs in selectedUsers array
            { $set: update } // Update the relevant field
        );

        console.log("Users updated successfully.");
        res.redirect("/display"); // or res.send("Users processed successfully!");
    } catch (error) {
        console.error("Error updating users:", error);
        res.status(500).send("Error processing users.");
    }
});


// Updated route to fetch and display data directly from MongoDB
app.get("/display", (req, res) => {
    MongoClient.connect(url)
        .then((client) => {
            const connect = client.db(databasename);
            const collection = connect.collection("updatedforms");

            collection.find({}).toArray()
                .then((ans) => {
                    // Render 'display.ejs' with the fetched data
                    res.render("open", { users: ans });
                })
                .catch((error) => {
                    console.error("Error fetching data:", error);
                    res.status(500).send("Error fetching data");
                });
        })
        .catch((error) => {
            console.error("Database connection error:", error);
            res.status(500).send("Database connection error");
        });
});

app.post("/datatransfer", (req, res) => {   
    const { branchname, "Ticket ID": ticket_id, "Change log": change_log, Dependency: dependency, "Developer name": developer_name } = req.body;

    const newFormData = new FormData({
        BranchName: branchname,
        TicketID: ticket_id,
        ChangeLog: change_log,
        Dependency: dependency,
        DeveloperName: developer_name,
    });

    // updated schema
    var IsApproved = false;
    var IsPublished = false;
    const updatedformdata = new Updatedmodel({
        BranchName: branchname,
        TicketID: ticket_id,
        ChangeLog: change_log,
        Dependency: dependency,
        DeveloperName: developer_name,
        IsApproved: IsApproved,
        IsPublished: IsPublished,
    });

    newFormData.save()
        .then(() => {
            console.log("Data saved successfully");
            // res.redirect("/display"); // Redirect to display data after saving
        })
        .catch((error) => {
            console.error("Error saving data:", error);
            res.status(500).send("Error saving data");
        });

    // updated formdata 

    updatedformdata.save()
        .then(() => {
            console.log("Data saved successfully in updated form");
            res.redirect("/display"); // Redirect to display data after saving
        })
        .catch((error) => {
            console.error("Error saving data:", error);
            res.status(500).send("Error saving data");
        });
});

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});