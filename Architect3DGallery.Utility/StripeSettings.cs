using System;
using System.Collections.Generic;
using System.Text;

namespace Architect3DGallery.Utility
{
    public class StripeSettings
    {
        //DS: we use these properties to inject the keys from appsettings.json in the UI
        //DS: we basically map these properties the keys from appsettings.json
        //DS: so when we retrieve the properties of this class, we will have the value of each key from appsettings.json
        //DS: the mapping is done inside Startup.cs
        public string SecretKey { get; set; }
        public string PublishableKey { get; set; }
    }
}