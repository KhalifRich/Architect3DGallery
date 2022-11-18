using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Architect3DGallery.DataAccess.Repository.IRepository;
using Architect3DGallery.Models;
using Architect3DGallery.Utility;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Architect3DGallery.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class ProductTypeController : Controller
    {
        private readonly IUnitOfWork _unitOfWork;

        public ProductTypeController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }
        [Authorize(Roles = SD.Admin_Role)]
        public IActionResult Index()
        {
            return View();
        }
        [Authorize(Roles = SD.Admin_Role)]
        public IActionResult Upsert(int? id)
        {
            ProductType ProductType = new ProductType();
            if (id == null)
            {
                //this is for create
                return View(ProductType);
            }
            //this is for edit
            ProductType = _unitOfWork.ProductType.Get(id.GetValueOrDefault());
            if (ProductType == null)
            {
                return NotFound();
            }
            return View(ProductType);

        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = SD.Admin_Role)]
        public IActionResult Upsert(ProductType ProductType)
        {
            if (ModelState.IsValid)
            {
                if (ProductType.Id == 0)
                {
                    _unitOfWork.ProductType.Add(ProductType);

                }
                else
                {
                    _unitOfWork.ProductType.Update(ProductType);
                }
                _unitOfWork.Save();
                return RedirectToAction(nameof(Index));
            }
            return View(ProductType);
        }


        #region API CALLS

        [HttpGet]
        public IActionResult GetAll()
        {
            var allObj = _unitOfWork.ProductType.GetAll();
            return Json(new { data = allObj });
        }

        [HttpDelete]
        public IActionResult Delete(int id)
        {
            var objFromDb = _unitOfWork.ProductType.Get(id);
            if (objFromDb == null)
            {
                return Json(new { success = false, message = "Error while deleting" });
            }
            _unitOfWork.ProductType.Remove(objFromDb);
            _unitOfWork.Save();
            return Json(new { success = true, message = "Delete Successful" });

        }

        #endregion
    }
}