sessionStorage.setItem( "total", 120 );
var total = sessionStorage.getItem( "total" );
console.log( total ); // '120', a string
var total = parseInt( sessionStorage.getItem( "total" ) );
var quantity = 2;
var updatedTotal = total * quantity;
sessionStorage.setItem( "total", updatedTotal ); // '240', a string
var cart = {
    item: "Product",
    price: 10.50,
    qty: 2
};
var jsonStr = JSON.stringify( cart );
sessionStorage.setItem( "cart", jsonStr );
// now the cart is {"item":"Product 1","price":15.50,"qty":2}
var cartValue = sessionStorage.getItem( "cart" );
var cartObj = JSON.parse( cartValue );
// original object

(function( $ ) {
    $.Download = function( element ) {
        this.$element = $( element ); // top-level element
        this.init();
    };

    $.Download.object = {
        init: function() {
            // initializes properties and methods
        }
    };

    $(function() {
        var shop = new $.Download( "#site" ); // object's instance
    });

})( jQuery );

$(function() {
    var shop = new $.Download( "#site" );
    console.log( shop.$element );

    $.Download.object = {
        init: function() {
            // Properties
    
                this.cartPrefix = "winery-"; // prefix string to be prepended to the cart's name in session storage
                this.cartName = this.cartPrefix + "cart"; // cart's name in session storage
                this.objectcost  = this.cartPrefix + "objectcost "; // objectcost   key in session storage
                this.total = this.cartPrefix + "total"; // total key in the session storage
                this.storage = sessionStorage; // shortcut to sessionStorage object
    
                this.$formAddToCart = this.$element.find( "form.add-to-cart" ); // forms for adding items to the cart
                this.$formCart = this.$element.find( "#shopping-cart" ); // Shopping cart form
                this.$checkoutCart = this.$element.find( "#checkout-cart" ); // checkout form cart
                this.$checkoutOrderForm = this.$element.find( "#checkout-order-form" ); // checkout user details form
                this.$objectcost = this.$element.find( "#sobjectcost " ); // element that displays the sW rates
                this.$subTotal = this.$element.find( "#stotal" ); // element that displays the subtotal charges
                this.$shoppingCartActions = this.$element.find( "#shopping-cart-actions" ); // cart actions links
                this.$updateCartBtn = this.$shoppingCartActions.find( "#update-cart" ); // update cart button
                this.$emptyCartBtn = this.$shoppingCartActions.find( "#empty-cart" ); // empty cart button
                this.$userDetails = this.$element.find( "#user-details-content" ); // element that displays the user's information
                this.$paypalForm = this.$element.find( "#paypal-form" ); // PayPal form
    
                this.currency = "&euro;"; // HTML entity of the currency to be displayed in layout
                this.currencyString = "€"; // currency symbol as text string
                this.paypalCurrency = "EUR"; // PayPal's currency code
                this.paypalBusinessEmail = "calebkemboi99@gmail.com"; // your PayPal Business account email address
                this.paypalURL = "https://www.sandbox.paypal.com/cgi-bin/webscr"; // URL of the PayPal form
    
                // object containing patterns for form validation
                this.requiredFields = {
                    expression: {
                        value: /^([w-.]+)@((?:[w]+.)+)([a-z]){2,4}$/
                    }
    
                    str: {
                        value: ""
                    }
    
                };
    
                // public methods invocation
        }
    };if( $element.length ) {
        // the element exists
    }

var $body = $( "body" ),
    page = $body.attr( "id" );

    switch( page ) {
        case "product-list":
            // actions for handling products
            break;
        case "shopping-cart":
            // actions for handling the shopping cart
            break;
        case "checkout":
            // actions for handling the checkout's page
            break;
        default:
            break;
    }
    $.Download.object = {
        // empties session storage
    
        _emptyCart: function() {
            this.storage.clear();
        }
    };
        
/* Format a number by decimal places
 * @param num Number the number to be formatted
 * @param places Number the decimal places
 * @returns n Number the formatted number
*/

_formatNumber: function( num, places ) {
    var n = num.toFixed( places );
    return n;
}
        /* Extract the numeric portion from a string
 * @param element Object the jQuery element that contains the relevant string
 * @returns price String the numeric string
 */

_extractPrice: function( element ) {
    var self = this;
    var text = element.text();
    var price = text.replace( self.currencyString, "" ).replace( " ", "" );
    return price;
}
var text = $.trim( element.text() );

       /* Converts a numeric string into a number
 * @param numStr String the numeric string to be converted
 * @returns num Number the number, or false if the string cannot be converted
 */

_convertString: function( numStr ) {
    var num;
    if( /^[-+]?[0-9]+.[0-9]+$/.test( numStr ) ) {
        num = parseFloat( numStr );
    } else if( /^d+$/.test( numStr ) ) {
        num = parseInt( numStr );
    } else {
        num = Number( numStr );
    }

    if( !isNaN( num ) ) {
        return num;
    } else {
        console.warn( numStr + " cannot be converted into a number" );
        return false;
    }
}

/* Converts a number to a string
 * @param n Number the number to be converted
 * @returns str String the string returned
 */

_convertNumber: function( n ) {
    var str = n.toString();
    return str;
} 

    /* Converts a JSON string to a JavaScript object
 * @param str String the JSON string
 * @returns obj Object the JavaScript object
 */

_toJSONObject: function( str ) {
    var obj = JSON.parse( str );
    return obj;
}

/* Converts a JavaScript object to a JSON string
 * @param obj Object the JavaScript object
 * @returns str String the JSON string
 */

_toJSONString: function( obj ) {
    var str = JSON.stringify( obj );
    return str;
}
    /* Add an object to the cart as a JSON string
 * @param values Object the object to be added to the cart
 * @returns void
 */

_addToCart: function( values ) {
    var cart = this.storage.getItem( this.cartName );
    var cartObject = this._toJSONObject( cart );
    var cartCopy = cartObject;
    var items = cartCopy.items;
    items.push( values );

    this.storage.setItem( this.cartName, this._toJSONString( cartCopy ) );
}
this._addToCart({
    product: "Test",
    qty: 1,
    price: 2
});

/*Change sW to web charges and analyse billing handler*/
 
    /* Custom sW rates calculated based on total quantity of items in cart
 * @param qty Number the total quantity of items
 * @returns object Number the objectcost 
 */

_calculateobjectcost : function( qty ) {
    var  objectcost = 0;
    if( qty >= 6 ) {
        objectcost  = 10;
    }
    if( qty >= 12 && qty <= 30 ) {
        objectcost  = 20;
    }

    if( qty >= 30 && qty <= 60 ) {
        objectcost = 30;
    }

    if( qty > 60 ) {
        objectcost = 0;
    }

    return objectcost;

}
        /* Validates the checkout form
 * @param form Object the jQuery element of the checkout form
 * @returns valid Boolean true for success, false for failure
 */

_validateForm: function( form ) {
    var self = this;
    var fields = self.requiredFields;
    var $visibleSet = form.find( "fieldset:visible" );
    var valid = true;

    form.find( ".message" ).remove();

$visibleSet.each(function() {

    $( this ).find( ":input" ).each(function() {
    var $input = $( this );
    var type = $input.data( "type" );
    var msg = $input.data( "message" );

    if( type == "string" ) {
        if( $input.val() == fields.str.value ) {
            $( "<span class='message'/>" ).text( msg ).
            insertBefore( $input );

            valid = false;
        }
    } else {
        if( !fields.expression.value.test( $input.val() ) ) {
            $( "<span class='message'/>" ).text( msg ).
            insertBefore( $input );

            valid = false;
        }
    }

});
});

return valid;
}
    /* Save the data entered by the user in the checkout form
 * @param form Object the jQuery element of the checkout form
 * @returns void
 */

_saveFormData: function( form ) {
    var self = this;
    var $visibleSet = form.find( "fieldset:visible" );

    $visibleSet.each(function() {
        var $set = $( this );
        if( $set.is( "#fieldset-billing" ) ) {
            var name = $( "#name", $set ).val();
            var email = $( "#email", $set ).val();
            var city = $( "#city", $set ).val();
            var address = $( "#address", $set ).val();
            var zip = $( "#zip", $set ).val();
            var country = $( "#country", $set ).val();

            self.storage.setItem( "billing-name", name );
            self.storage.setItem( "billing-email", email );
            self.storage.setItem( "billing-city", city );
            self.storage.setItem( "billing-address", address );
            self.storage.setItem( "billing-zip", zip );
            self.storage.setItem( "billing-country", country );
        } else {
            var sName = $( "#sname", $set ).val();
            var sEmail = $( "#semail", $set ).val();
            var sCity = $( "#scity", $set ).val();
            var sAddress = $( "#saddress", $set ).val();
            var sZip = $( "#szip", $set ).val();
            var sCountry = $( "#scountry", $set ).val();

            self.storage.setItem( "user-name", sName );
            self.storage.setItem( "user-email", sEmail );
            self.storage.setItem( "user-city", sCity );
            self.storage.setItem( "user-address", sAddress );
            self.storage.setItem( "user-zip", sZip );
            self.storage.setItem( "user-country", sCountry );

        }
    });
}
        // Creates the cart keys in session storage

createCart: function() {
    if( this.storage.getItem( this.cartName ) == null ) {

        var cart = {};
        cart.items = [];

        this.storage.setItem( this.cartName, this._toJSONString( cart ) );
        this.storage.setItem( this.objectcost, "0" );
        this.storage.setItem( this.total, "0" );
    }
}
        /* Adds items to shopping cart*/

    handleAddToCartForm: function() {
    var self = this;
    self.$formAddToCart.each(function() {
        var $form = $( this );
        var $product = $form.parent();
        var price = self._convertString( $product.data( "price" ) );
        var name =  $product.data( "name" );

        $form.on( "submit", function() {
            var qty = self._convertString( $form.find( ".qty" ).val() );
            var subTotal = qty * price;
            var total = self._convertString( self.storage.getItem( self.total ) );
            var sTotal = total + subTotal;
            self.storage.setItem( self.total, sTotal );
            self._addToCart({
                product: name,
                price: price,
                qty: qty
            });
            var object = self._convertString( self.storage.getItem( self.objectcost ) );
            var object = self._calculateobject( qty );
            var total price = objectCost;

            self.storage.setItem( self.objectcost, totalobject );
        });
    });
}
    // Displays the shopping cart

displayCart: function() {
    if( this.$formCart.length ) {
        var cart = this._toJSONObject( this.storage.getItem( this.cartName ) );
        var items = cart.items;
        var $tableCart = this.$formCart.find( ".Downloadping-cart" );
        var $tableCartBody = $tableCart.find( "tbody" );

        for( var i = 0; i < items.length; ++i ) {
            var item = items[i];
            var product = item.product;
            var price = this.currency + " " + item.price;
            var qty = item.qty;
            var html = "<tr><td class='pname'>" + product + "</td>" + "<td class='pqty'><input type='text' value='" + qty + "' class='qty'/></td>" + "<td class='pprice'>" + price + "</td></tr>";

            $tableCartBody.html( $tableCartBody.html() + html );
        }

        var total = this.storage.getItem( this.total );
        this.$subTotal[0].innerHTML = this.currency + " " + total;
    } else if( this.$checkoutCart.length ) {
        var checkoutCart = this._toJSONObject( this.storage.getItem( this.cartName ) );
        var cartItems = checkoutCart.items;
        var $cartBody = this.$checkoutCart.find( "tbody" );

        for( var j = 0; j < cartItems.length; ++j ) {
            var cartItem = cartItems[j];
            var cartProduct = cartItem.product;
            var cartPrice = this.currency + " " + cartItem.price;
            var cartQty = cartItem.qty;
            var cartHTML = "<tr><td class='pname'>" + cartProduct + "</td>" + "<td class='pqty'>" + cartQty + "</td>" + "<td class='pprice'>" + cartPrice + "</td></tr>";

            $cartBody.html( $cartBody.html() + cartHTML );
        }

        var cartTotal = this.storage.getItem( this.total );
        var cartWeb_charges = this.storage.getItem( this.objectCost );
        var subTot = this._convertString( cartTotal ) + this._convertString( cartobjectcost );

        this.$subTotal[0].innerHTML = this.currency + " " + this._convertNumber( subTot );
        this.$objectcost[0].innerHTML = this.currency + " " + objectcost;

    }
}    
var items = [                           //search on how to incorporate uploaded items
    {
        product: "Test",
        qty: 1,
        price: 5
    }
    
        product: "Foo",
        qty: 5,
        price: 10
    }
    {
        product: "Bar",
        qty: 2,
        price: 8
    }
];

items = $.grep( items, function( item ) {
    return item.product !== "Test";

});

console.log( items );

/*
    Array[2]
        0: Object
            price: 10
            product: "Foo"
            qty: 5
        1: Object
            price: 8
            product: "Bar"
            qty: 2
*/
        
// Updates the cart

updateCart: function() {
    var self = this;
if( self.$updateCartBtn.length ) {
    self.$updateCartBtn.on( "click", function() {
        var $rows = self.$formCart.find( "tbody tr" );
        var cart = self.storage.getItem( self.cartName );
        var AdvertisingCost = self.storage.getItem( self.AdvertisingCost );
        var total = self.storage.getItem( self.total );

        var updatedTotal = 0;
        var totalQty = 0;
        var updatedCart = {};
        updatedCart.items = [];

        $rows.each(function() {
            var $row = $( this );
            var pname = $.trim( $row.find( ".pname" ).text() );
            var pqty = self._convertString( $row.find( ".pqty > .qty" ).val() );
            var pprice = self._convertString( self._extractPrice( $row.find( ".pprice" ) ) );

            var cartObj = {
                product: pname,
                price: pprice,
                qty: pqty
            };

            updatedCart.items.push( cartObj );

            var subTotal = pqty * pprice;
            updatedTotal += subTotal;
            totalQty += pqty;
        });

        self.storage.setItem( self.total, self._convertNumber( updatedTotal ) );
        self.storage.setItem( self.sWRates, self._convertNumber( self._calculateCost( totalQty ) ) );
        self.storage.setItem( self.cartName, self._toJSONString( updatedCart ) );

    });
}
}
            // Empties the cart by calling the _emptyCart() method
// @see $.Download._emptyCart()

emptyCart: function() {
    var self = this;
    if( self.$emptyCartBtn.length ) {
        self.$emptyCartBtn.on( "click", function() {
            self._emptyCart();
        });
    }
}
            // Handles the checkout form by adding a validation routine and saving user’s info in session storage

handleCheckoutOrderForm: function() {
    var self = this;
    if( self.$checkoutOrderForm.length ) {
        var $sameAsBilling = $( "#same-as-billing" );
        $sameAsBilling.on( "change", function() {
            var $check = $( this );
            if( $check.prop( "checked" ) ) {
                $( "#fieldset-wW" ).slideUp( "normal" );
            } else {
                $( "#fieldset-wW" ).slideDown( "normal" );
            }
        });

        self.$checkoutOrderForm.on( "submit", function() {
            var $form = $( this );
            var valid = self._validateForm( $form );

            if( !valid ) {
                return valid;
            } else {
                self._saveFormData( $form );
            }
        });
    }
}
displayUserDetails: function() {
    if( this.$userDetails.length ) {
        if( this.storage.getItem( "user-name" ) == null ) {             //Initially was wW
            var name = this.storage.getItem( "billing-name" );
            var email = this.storage.getItem( "billing-email" );
            var city = this.storage.getItem( "billing-city" );
            var address = this.storage.getItem( "billing-address" );
            var zip = this.storage.getItem( "billing-zip" );
            var country = this.storage.getItem( "billing-country" );

            var html = "<div class='detail'>";
                html += "<h2>Billing and Advertising</h2>";
                html += "<ul>";
                html += "<li>" + name + "</li>";
                html += "<li>" + email + "</li>";
                html += "<li>" + city + "</li>";
                html += "<li>" + address + "</li>";
                html += "<li>" + zip + "</li>";
                html += "<li>" + country + "</li>";
                html += "</ul></div>";

            this.$userDetails[0].innerHTML = html;
        } else {
            var name = this.storage.getItem( "billing-name" );
            var email = this.storage.getItem( "billing-email" );
            var city = this.storage.getItem( "billing-city" );
            var address = this.storage.getItem( "billing-address" );
            var zip = this.storage.getItem( "billing-zip" );
            var country = this.storage.getItem( "billing-country" );

            var sName = this.storage.getItem( "sW-name" );
            var sEmail = this.storage.getItem( "sW-email" );
            var sCity = this.storage.getItem( "sW-city" );
            var sAddress = this.storage.getItem( "sW-address" );
            var sZip = this.storage.getItem( "sW-zip" );
            var sCountry = this.storage.getItem( "sW-country" );

            var html = "<div class='detail'>";
                html += "<h2>Billing</h2>";
                html += "<ul>";
                html += "<li>" + name + "</li>";
                html += "<li>" + email + "</li>";
                html += "<li>" + city + "</li>";
                html += "<li>" + address + "</li>";
                html += "<li>" + zip + "</li>";
                html += "<li>" + country + "</li>";
                html += "</ul></div>";

                html += "<div class='detail right'>";
                html += "<h2>SW</h2>";
                html += "<ul>";
                html += "<li>" + sName + "</li>";
                html += "<li>" + sEmail + "</li>";
                html += "<li>" + sCity + "</li>";
                html += "<li>" + sAddress + "</li>";
                html += "<li>" + sZip + "</li>";
                html += "<li>" + sCountry + "</li>";
                html += "</ul></div>";

            this.$userDetails[0].innerHTML = html;

        }
    }
}
    // Appends the required hidden values to PayPal's form before submitting

populatePayPalForm: function() {
    var self = this;
    if( self.$paypalForm.length ) {
        var $form = self.$paypalForm;
        var cart = self._toJSONObject( self.storage.getItem( self.cartName ) );
        var sW = self.storage.getItem( self.sWRates );
        var numSW = self._convertString( sW );
        var cartItems = cart.items;
        var singSW = Math.floor( numSW / cartItems.length );

        $form.attr( "action", self.paypalURL );
        $form.find( "input[name='business']" ).val( self.paypalBusinessEmail );
        $form.find( "input[name='currency_code']" ).val( self.paypalCurrency );

        for( var i = 0; i < cartItems.length; ++i ) {
            var cartItem = cartItems[i];
            var n = i + 1;
            var name = cartItem.product;
            var price = cartItem.price;
            var qty = cartItem.qty;

            $( "<div/>" ).html( "<input type='hidden' name='quantity_" + n + "' value='" + qty + "'/>" ).
            insertBefore( "#paypal-btn" );
            $( "<div/>" ).html( "<input type='hidden' name='item_name_" + n + "' value='" + name + "'/>" ).
            insertBefore( "#paypal-btn" );
            $( "<div/>" ).html( "<input type='hidden' name='item_number_" + n + "' value='SKU " + name + "'/>" ).
            insertBefore( "#paypal-btn" );
            $( "<div/>" ).html( "<input type='hidden' name='amount_" + n + "' value='" + self._formatNumber( price, 2 ) + "'/>" ).
            insertBefore( "#paypal-btn" );
            $( "<div/>" ).html( "<input type='hidden' name='sW_" + n + "' value='" + self._formatNumber( singSW, 2 ) + "'/>" ).
            insertBefore( "#paypal-btn" );

        }

    }
}
});