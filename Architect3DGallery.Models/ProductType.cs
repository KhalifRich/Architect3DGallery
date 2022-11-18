using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Architect3DGallery.Models
{
    public class ProductType
    {
        [Key]
        public int Id { get; set; }

        [Display(Name= "Product Type")]
        [Required]
        [MaxLength(50)]
        public string Name { get; set; }
    }
}