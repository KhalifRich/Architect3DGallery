using Architect3DGallery.DataAccess.Repository.IRepository;
using Architect3DGallery.Models;
using Architect3DGalleryWeb.DataAccess.Data;
using System;
using System.Collections.Generic;
using System.Text;

namespace Architect3DGallery.DataAccess.Repository
{
    public class OrderDetailsRepository : Repository<OrderDetails>, IOrderDetailsRepository
    {
        private ApplicationDbContext _db;

        public OrderDetailsRepository(ApplicationDbContext db) : base(db)
        {
            _db = db;
        }


        public void Update(OrderDetails obj)
        {
            _db.OrderDetail.Update(obj);
        }
    }
}