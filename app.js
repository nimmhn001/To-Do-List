const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/toDoListDB", {useNewUrlParser: true});
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
const _ = require("lodash");



// items model
const ItemsSchema = new mongoose.Schema({
    name : String
});

const Item = mongoose.model("Item", ItemsSchema);

// creating a new list model
const ListSchema = new mongoose.Schema({
    name: String,
    items: [ItemsSchema]
});
const List = mongoose.model("List", ListSchema);

// creating 3 default items that is to appear in every to-do list
const item1 = new Item({
    name: "Welcome to your to-do list!"
});

const item2 = new Item({
    name: "Hit the '+' button to add new item"
});

const item3= new Item({
    name: " <- Hit this to delete an item"
});

// array of default items
defaultArray = [item1, item2, item3];

// get request to home route
app.get("/", function(req, res)
{
    let day = date();
    Item.find({},function(err, foundItems)
    {
        if(foundItems.length == 0)
        {
            Item.insertMany(defaultArray, function(err)
            {
                if(err)
                    console.log(err);
                else
                    console.log("Successfully added the default items");
            });
            res.redirect("/");
        }
        else
            res.render("list", {listTitle: "Today", newListItems: foundItems, day: day});   
    });
});

app.get("/create", function(req, res)
{
    List.find({}, function(err, results)
    {
        if(!err)
        {
            res.render("mylists", {ListItems: results});
        }
    })
});

app.post("/deleteList", function(req, res)
{
    const ListId = req.body.checkbox;
    List.findByIdAndDelete(ListId, function(err, result)
    {
        if(!err)
        {
            res.redirect("/create");
        }
    });
});

app.post("/create", function(req, res)
{
    const newlistname = req.body.new_list;
    res.redirect("/list/" + newlistname);
});

// post request to home route
app.post("/", function(req, res)
{
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const new_item = new Item({
        name : itemName
    });
    if(listName === "Today")
    {
        new_item.save(); // mongo short-cut to save it to the database
        res.redirect("/") // redirect to the home route so that the new item loads on screen, as home route does this job.
    }
    else
    {
        List.findOne({name: listName}, function(err, foundList)
        {
            if(!err)
            {
                foundList.items.push(new_item);
                foundList.save();
                res.redirect("/list/" + listName);
            }
        });
    }

  
});


// creating a dynamic route, based on user entered url
app.get("/list/:customListName", function(req, res)
{
    let day = date();
    const customListName = _.capitalize(req.params.customListName);  // so that even user enters "home", list name becomes "Home", capitalizes 1st letter.
    console.log(customListName);
    List.findOne({name:customListName}, function(err, results)
    {
        if(!err)
        {
            if(!results)
            {
                const list = new List({
                    name: customListName,
                    items : defaultArray
                });
                list.save();
                res.redirect("/list/" + customListName);
            }
            else
            {
                const list = results;
                console.log("here");
                res.render("list", {listTitle: customListName, newListItems: list.items, day: day}); 
            }
        }
    });
});

// handles deletion of checked items
app.post("/delete", function(req, res)
{
    const item_id_to_delete = req.body.checkbox; // checkbox will return the value, which is been equated to the item id in list.ejs file
    const listName = req.body.listName; // take the list name where we have to perform the deletion
    if(listName === "Today")
    {
        Item.findByIdAndRemove(item_id_to_delete, function(err)
        {
            if(err)
                console.log(err);
            else
                console.log("success");
        });
        res.redirect("/");
    }
    else
    {
        List.findOneAndUpdate({name: listName}, {$pull : {items : {_id : item_id_to_delete}}}, function(err, foundItem)
        {
            if(!err)
            {
                res.redirect("/list/" + listName);
            }
        });
    }  
});

// about page
app.get("/about", function(req, res)
{
    res.render("about");
});

// server at port 3000
let port = process.env.PORT;
if(port == null || port == "")
    port = 3000;
app.listen(port, function()
{
    console.log("Server has started successfully");
});









// Item.updateOne({name:  "Welcome to you to-do list!"}, {name :"Welcome to your to-do list!" },function(err)
// {
//     if(err)
//         console.log(err);
//     else
//         console.log("Succesfully updated");
// });
// Item.deleteMany({name : "Welcome to you to-do list!" }, function(err)
// {
//     if(err)
//         console.log(err);
//     else    console.log("deleted");
// });
// Item.deleteMany({name :  "Hit the '+' button to add new item"},  function(err)
// {
//     if(err)
//         console.log(err);
//     else    console.log("deleted");
// });
// Item.deleteMany({name :  "Hit <- this to delete an item"},  function(err)
// {
//     if(err)
//         console.log(err);
//     else    console.log("deleted");
// });

