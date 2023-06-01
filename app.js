//jshint esversion: 6
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";

const app = express();
app.set( 'view engine', 'ejs' );

app.use( bodyParser.urlencoded( { extended: true } ) );

app.use( express.static( "public" ) );

mongoose.connect( "mongodb+srv://naveenjsr:12345@cluster0.bwld2wk.mongodb.net/todolistDB?retryWrites=true&w=majority",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    } )
    .then( () =>
    {
        console.log( "database connected" );
    } )
    .catch( ( err ) =>
    {
        console.log( err );
    } );

const itemSchema = new mongoose.Schema( {
    name: String
} );

const Item = new mongoose.model( "Item", itemSchema );


const item1 = new Item( {
    name: "welcome to todo list"
} );

const item2 = new Item( {
    name: "press + icon to add list "
} );

const item3 = new Item( {
    name: "press - icon to deletr list"
} );

const defaultItem = [ item1, item2, item3 ];

const listSchema = {
    name: String,
    items: [ itemSchema ]
};

const List = mongoose.model( "List", listSchema );

app.get( "/", function ( req, res )
{
    Item.find( {} )
        .then( ( foundItems ) =>
        {
            if ( foundItems.length === 0 )
            {
                Item.insertMany( defaultItem )
                    .then( () =>
                    {
                        res.redirect( "/" );
                    } )
                    .catch( ( err ) =>
                    {
                        console.log( err );
                    } );
            } else
            {
                res.render( "list", { listTitle: "Today", newlistItems: foundItems } );
            }

        } )
        .catch( ( err ) =>
        {
            console.log( err );
        } );

} );

app.get( "/:customlistname", function ( req, res )
{
    const customListName = _.capitalize( req.params.customlistname );

    List.findOne( { name: customListName } )
        .then( ( foundlist ) =>
        {
            if ( !foundlist )
            {
                //create new list

                const list = List( {
                    name: customListName,
                    items: defaultItem
                } );

                list.save();

                res.redirect( "/" + customListName );

            }
            else
            {
                res.render( "list", { listTitle: foundlist.name, newlistItems: foundlist.items } );
            }
        } )
        .catch( ( err ) =>
        {
            console.log( err );
        } );
} );

app.post( "/", function ( req, res )
{
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item( {
        name: itemName
    } );

    if ( listName === "Today" )
    {
        item.save();
        res.redirect( "/" );
    } else
    {
        List.findOne( { name: listName } )
            .then( ( foundList ) =>
            {
                foundList.items.push( item );
                foundList.save();
                res.redirect( "/" + listName );
            } )
            .catch( ( err ) =>
            {
                console.log( err );
            } );
    }


} );

app.post( "/delete", function ( req, res )
{
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if ( listName === "Today" )
    {
        Item.findByIdAndRemove( checkedItemId )
            .then( () =>
            {
                console.log( "item deleted" );
                res.redirect( "/" );
            } )
            .catch( ( err ) =>
            {
                console.log( err );
            } );
    }
    else
    {
        List.findOneAndUpdate( { name: listName }, { $pull: { items: { _id: checkedItemId } } } )
            .then( () =>
            {
                res.redirect( "/" + listName );
            } )
            .catch( ( err ) =>
            {
                console.log( err );
            } );
    }


} );



app.listen( 3000, function ()
{
    console.log( "Server has started succesfully" );
} );