import axios from "axios";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaXmark } from "react-icons/fa6";




const EditOrderPrice = ({toggle, setToggle, dataOrder, onPriceUpdate}) => {
    const [totalPrice, setTotalPrice] = useState("");
      const { t, i18n } = useTranslation();
      const currentLang = i18n.language;
     

  
    const handleChangeStatus = async (e) => {
        e.preventDefault();

        const pricePattern = /\d{1,}/;
        const total = Number(totalPrice);
        const orderId = dataOrder ? Number(dataOrder.orderID) : null;

        if (totalPrice === "" || !pricePattern.test(totalPrice)) {
          alert(currentLang === "ar" ? "يرجى إدخال السعر الكلي والتأكد من القمية" : "Please enter the total price of the service and make sure of the value");
          return;
        }


        console.log(total, orderId);

        try {
          await axios.put(`https://laundryar7.runasp.net/api/Laundry/UpdateTotalPrice?OrderID=${orderId}&TotalAmount=${totalPrice}`);
          setToggle(!toggle);
          setTotalPrice("");
          if (onPriceUpdate) {
            onPriceUpdate();
          }
        } catch (err) {
          console.log("Error updating status:", err);
        }
      };
    return (
      <>
        <div dir={currentLang === "ar" ? "rtl" : "ltr"} className={`${toggle ? "visible" : "invisible"} transition bg-[#00000096] fixed w-full h-full top-0 left-0 z-40 backdrop-blur-sm`}></div>
        <div className={`
          ${toggle ? " scale-100" : " scale-0"}
               transition fixed z-50  bg-[#EEE] dark:bg-gray-900 py-9 px-6 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 lg:w-[55%] w-[95%] rounded-xl`}>
          <FaXmark onClick={() => setToggle(!toggle)} className=" absolute top-5 right-5 cursor-pointer transition text-gray-600 dark:text-gray-400 hover:text-blue-500" size={25} />
          <form
          onSubmit={handleChangeStatus}
          className="text-center">
          <div className="mt-10 last:mb-0">
            <input
              type="text"
              className="px-4 py-3 rounded-xl w-full outline-none bg-white dark:bg-gray-800 dark:text-white border border-transparent dark:border-gray-700 focus:border-blue-500"
              id="order"
              placeholder={currentLang === "ar" ? "السعر الكلي للخدمة" : "Total Price of Service"}
              name="statusOrder"
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)} 
            />
           
          </div>
          <button type="submit" className="bg-blue-500 py-3 px-4 rounded-xl text-white lg:w-36 w-full text-lg cursor-pointer mt-3"> 
          {currentLang === "ar" ? "تحديث السعر" : "Update Price"}  
          </button>
        </form>
        </div> 
      </>
    )
};export default EditOrderPrice
