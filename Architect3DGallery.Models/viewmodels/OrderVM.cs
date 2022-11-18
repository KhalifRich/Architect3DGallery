using System;
using System.Collections.Generic;
using System.Text;

namespace Architect3DGallery.Models.ViewModels
{
    public class OrderVM
    {
        public OrderHeader OrderHeader { get; set; }
        public IEnumerable<OrderDetails> OrderDetails { get; set; }
    }
}