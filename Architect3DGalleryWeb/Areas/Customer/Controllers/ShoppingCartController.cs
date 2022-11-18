using Architect3DGallery.DataAccess.Repository.IRepository;
using Architect3DGallery.Models;
using Architect3DGallery.Models.ViewModels;
using Architect3DGallery.Utility;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Mvc;
using Stripe.BillingPortal;
using Stripe;
using Stripe.Checkout;
using PayPal.Api;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Security.Claims;
using SessionCreateOptions = Stripe.Checkout.SessionCreateOptions;
using Session = Stripe.Checkout.Session;
using SessionService = Stripe.Checkout.SessionService;

namespace Architect3DGalleryWeb.Areas.Customer
{
        [Area("Customer")]
        [Authorize]
        public class ShoppingCartController : Controller
        {
            private readonly IUnitOfWork _unitOfWork;
            private readonly IEmailSender _emailSender;
        [BindProperty]
        public ShoppingCartVM ShoppingCartVM { get; set; }
        public ShoppingCartController(IUnitOfWork unitOfWork, IEmailSender emailSender)
            {
                _unitOfWork = unitOfWork;
                _emailSender = emailSender;
            }
            public IActionResult Index()
            {
            //DS: we create a variable 'claimsIdentity' and we initialize it with the name identifier
            var claimsIdentity = (ClaimsIdentity)User.Identity;
            //DS: we then create another variable 'claim' to extract the claim from the ClaimsIdentity
            var claim = claimsIdentity.FindFirst(ClaimTypes.NameIdentifier);

            ShoppingCartVM = new ShoppingCartVM()
                {
                    ListCart = _unitOfWork.ShoppingCart.GetAll(u => u.ApplicationUserId == claim.Value,
                    includeProperties: "Product"),
                    OrderHeader = new OrderHeader()
                };
                foreach (var cart in ShoppingCartVM.ListCart)
                {
                    cart.Price = GetPriceBasedOnQuantity(cart.Count, cart.Product.Price
                       );
                    ShoppingCartVM.OrderHeader.OrderTotal += (cart.Price * cart.Count);
                }
                return View(ShoppingCartVM);
            }

            public IActionResult Summary()
            {
            //DS: we create a variable 'claimsIdentity' and we initialize it with the name identifier
            var claimsIdentity = (ClaimsIdentity)User.Identity;
            //DS: we then create another variable 'claim' to extract the claim from the ClaimsIdentity
            var claim = claimsIdentity.FindFirst(ClaimTypes.NameIdentifier);

            ShoppingCartVM = new ShoppingCartVM()
                {
                    ListCart = _unitOfWork.ShoppingCart.GetAll(u => u.ApplicationUserId == claim.Value,
                    includeProperties: "Product"),
                    OrderHeader = new OrderHeader()
                };
            ShoppingCartVM.OrderHeader.ApplicationUser = _unitOfWork.ApplicationUser.GetFirstOrDefault(u => u.Id == claim.Value);

                ShoppingCartVM.OrderHeader.FirstName = ShoppingCartVM.OrderHeader.ApplicationUser.FirstName;
                ShoppingCartVM.OrderHeader.LastName = ShoppingCartVM.OrderHeader.ApplicationUser.LastName;
                ShoppingCartVM.OrderHeader.PhoneNumber = ShoppingCartVM.OrderHeader.ApplicationUser.PhoneNumber;
                ShoppingCartVM.OrderHeader.Email = ShoppingCartVM.OrderHeader.ApplicationUser.Email;
                ShoppingCartVM.OrderHeader.Address = ShoppingCartVM.OrderHeader.ApplicationUser.Address;



                foreach (var cart in ShoppingCartVM.ListCart)
                {
                    cart.Price = GetPriceBasedOnQuantity(cart.Count, cart.Product.Price
                       );
                    ShoppingCartVM.OrderHeader.OrderTotal += (cart.Price * cart.Count);
                }
                return View(ShoppingCartVM);
            }

            [HttpPost]
            [ActionName("Summary")]
            [ValidateAntiForgeryToken]
            public IActionResult SummaryPOST()
            {
                var claimsIdentity = (ClaimsIdentity)User.Identity;
                var claim = claimsIdentity.FindFirst(ClaimTypes.NameIdentifier);

                ShoppingCartVM.ListCart = _unitOfWork.ShoppingCart.GetAll(u => u.ApplicationUserId == claim.Value,
                    includeProperties: "Product");


                ShoppingCartVM.OrderHeader.OrderDate = System.DateTime.Now;
                ShoppingCartVM.OrderHeader.ApplicationUserId = claim.Value;


                foreach (var cart in ShoppingCartVM.ListCart)
                {
                    cart.Price = GetPriceBasedOnQuantity(cart.Count, cart.Product.Price
                       );
                    ShoppingCartVM.OrderHeader.OrderTotal += (cart.Price * cart.Count);
                }
                ApplicationUser applicationUser = _unitOfWork.ApplicationUser.GetFirstOrDefault(u => u.Id == claim.Value);

                //some things might need to be added here

                _unitOfWork.OrderHeader.Add(ShoppingCartVM.OrderHeader);
                _unitOfWork.Save();
                foreach (var cart in ShoppingCartVM.ListCart)
                {
                    OrderDetails OrderDetails = new OrderDetails()
                    {
                        ProductId = cart.ProductId,
                        OrderId = ShoppingCartVM.OrderHeader.Id,
                        Price = cart.Price,
                        Count = cart.Count
                    };
                    _unitOfWork.OrderDetails.Add(OrderDetails);
                    _unitOfWork.Save();
                }


                //some things might be added here at a later stage

                //DS: stripe settings from here
                //DS: comment for Liviu --> we might want to change the below line of code at a later stage
                var domain = "https://localhost:44318/";
                var options = new SessionCreateOptions //we create a session create option
                {
                    PaymentMethodTypes = new List<string> //
                {
                  "card", // this is the option for payment method
                },
                    LineItems = new List<SessionLineItemOptions>(), //DS: we create a new list of session LineItems,representing a list of the items from the shopping cart
                    Mode = "payment",
                  
                    SuccessUrl = domain + $"Customer/ShoppingCart/OrderConfirmation?id={ShoppingCartVM.OrderHeader.Id}",
                    CancelUrl = domain + $"Customer/ShoppingCart/Index",
                };
                
                foreach (var item in ShoppingCartVM.ListCart) 
                {
                //DS: the code below represents the 'LineItems' options 
                //Diana Sandu(DS): so foreach statement will apply the options for each product in the ListCart
                
                    var sessionLineItem = new SessionLineItemOptions
                    {
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            UnitAmount = (long)(item.Price * 100),//20.00 -> 2000
                            Currency = "usd",
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name = item.Product.Name
                            },

                        },
                        Quantity = item.Count,
                    };
                //we basically add the options for each product in the LineItems created above
                    options.LineItems.Add(sessionLineItem);

                }

                var service = new SessionService();
                Session session = service.Create(options);
                _unitOfWork.OrderHeader.UpdateStripePaymentID(ShoppingCartVM.OrderHeader.Id, session.Id, session.PaymentIntentId);
                _unitOfWork.Save();
                Response.Headers.Add("Location", session.Url);
                return new StatusCodeResult(303);


            }

            public IActionResult OrderConfirmation(int id)
            {
            //DS: retrieve order header from db based on the id
                OrderHeader orderHeader = _unitOfWork.OrderHeader.GetFirstOrDefault(u => u.Id == id, includeProperties: "ApplicationUser");
               //DS: 
               if (orderHeader.PaymentStatus != SD.PaymentStatusDelayedPayment)
                {
                    var service = new SessionService();
                    Session session = service.Get(orderHeader.SessionId);
                    //check the stripe status
                    if (session.PaymentStatus.ToLower() == "paid")
                    {
                        _unitOfWork.OrderHeader.UpdateStatus(id, SD.StatusApproved, SD.PaymentStatusApproved);
                        _unitOfWork.Save();
                    }
                }
               /* _emailSender.SendEmailAsync(orderHeader.ApplicationUser.Email, "New Order - LSDC Art Gallery", "<p>New Order Created</p>");*/
                List<ShoppingCart> shoppingCarts = _unitOfWork.ShoppingCart.GetAll(u => u.ApplicationUserId ==
                orderHeader.ApplicationUserId).ToList();
                _unitOfWork.ShoppingCart.RemoveRange(shoppingCarts);
                _unitOfWork.Save();
                return View(id);
            }

            public IActionResult Plus(int cartId)
            {
                var cart = _unitOfWork.ShoppingCart.GetFirstOrDefault(u => u.Id == cartId);
                _unitOfWork.ShoppingCart.IncrementCount(cart, 1);
                _unitOfWork.Save();
                return RedirectToAction(nameof(Index));
            }

            public IActionResult Minus(int cartId)
            {
                var cart = _unitOfWork.ShoppingCart.GetFirstOrDefault(u => u.Id == cartId);
                if (cart.Count <= 1)
                {
                    _unitOfWork.ShoppingCart.Remove(cart);
                    var count = _unitOfWork.ShoppingCart.GetAll(u => u.ApplicationUserId == cart.ApplicationUserId).ToList().Count - 1;
                    HttpContext.Session.SetInt32(SD.ssShoppingCart, count);
                }
                else
                {
                    _unitOfWork.ShoppingCart.DecrementCount(cart, 1);
                }
                _unitOfWork.Save();
                return RedirectToAction(nameof(Index));
            }

            public IActionResult Remove(int cartId)
            {
                var cart = _unitOfWork.ShoppingCart.GetFirstOrDefault(u => u.Id == cartId);
                _unitOfWork.ShoppingCart.Remove(cart);
                _unitOfWork.Save();
                var count = _unitOfWork.ShoppingCart.GetAll(u => u.ApplicationUserId == cart.ApplicationUserId).ToList().Count;
           /*     HttpContext.Session.SetInt32(SD.ssShoppingCart, count);*/
                return RedirectToAction(nameof(Index));
            }





            private double GetPriceBasedOnQuantity(double quantity, double price)
            {
                if (quantity <= 50)
                {
                    return price;
                }
                else
                    return price;

            }
        }
    }