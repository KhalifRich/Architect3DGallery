using System;
using System.Collections.Generic;
using System.Text;

namespace Architect3DGallery.Utility
{
    public static class SD
    {
        //used for the registration page for the user to choose role and for the admin to assign roles
        public const string Customer_Role = "Customer";
        public const string Artist_Role = "Artist";
        public const string Employee_Role = "Employee";
        public const string Admin_Role = "Admin";


        public const string StatusPending = "Pending";
        public const string StatusApproved = "Approved";
        public const string StatusInProcess = "Processing";
        public const string StatusDownloaded = "Downloaded";
        public const string StatusCancelled = "Cancelled";
        public const string StatusRefunded = "Refunded";

        public const string PaymentStatusPending = "Pending";
        public const string PaymentStatusApproved = "Approved";
        public const string PaymentStatusDelayedPayment = "ApprovedForDelayedPayment";
        public const string PaymentStatusRejected = "Rejected";

        public const string ssShoppingCart = "SessionShoppingCart";

    }
}