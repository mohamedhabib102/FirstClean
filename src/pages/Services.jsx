import { useEffect, useState } from "react"
import { FaPlus } from "react-icons/fa6";
import { FaMinus } from "react-icons/fa6";
import { FaXmark } from "react-icons/fa6";
import { useTranslation } from "react-i18next";
import axios from "axios"
import { useAuth } from "../Components/context/AuthContext";
import {
  FaShoppingCart,
  FaBoxOpen,
  FaComments,
  FaLock
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { FaCheck } from "react-icons/fa6";
import { MdFilterAlt, MdLocalLaundryService } from "react-icons/md";
import { IoClose } from "react-icons/io5";


export default function Services() {
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [toggle, setToggle] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("")
  const { t, i18n } = useTranslation();
  const { userId } = useAuth()
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")
  const [qtyModal, setQtyModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("normal"); // normal, carpet
  const [showFilter, setShowFilter] = useState(false);
  

  useEffect(() => {
    getAllServces()
  }, [])


  const getAllServces = async () => {
    try {
      setLoading(true)
      const res = await axios.get("https://laundryar7.runasp.net/api/Laundry/GetAllServices");
      const data = res.data.map((item) => ({
        ...item, quantity: 1,
      }));
      setServices(data)
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false)
    }
  }

  const currentLang = i18n.language;
  const toggleChange = () => {
    if (!userId) {
      setMessage(currentLang === "ar" ? "الرجاء تسجيل الدخول" : "Please login first")
      setTimeout(() => {
        setMessage("")
      }, 1900)
      return;
    }
    setToggle(!toggle)
  }

  const toggleQtyModal = (id = null) => {
    setEditingService(id);
    setQtyModal(!qtyModal);
  }

  const confirmService = (id) => {
    const selectedService = services.find(s => s.servicesID === id);
    const isServiceCarpet = selectedService?.advancedTime === true;
    
    // if adding (not removing)
    if (selectedServices.length > 0) {
      const firstSelectedService = services.find(s => s.servicesID === selectedServices[0]);
      const isFirstServiceCarpet = firstSelectedService?.advancedTime === true;
      
      // If mixing types, show message and return
      if (isServiceCarpet !== isFirstServiceCarpet) {
        alert(currentLang === "ar" ? "لا يمكن اختيار منتجات مختلفة" : "Cannot select different product types");
        return;
      }
    }
    
    if (!selectedServices.includes(id)) {
      setSelectedServices([...selectedServices, id]);
    }
    setQtyModal(false);
  }

  const toggleServiceSelection = (id) => {
    const selectedService = services.find(s => s.servicesID === id);
    const isServiceCarpet = selectedService?.advancedTime === true;
    
    // إذا كان بيضيف (مش بيزيل)
    if (!selectedServices.includes(id) && selectedServices.length > 0) {
      const firstSelectedService = services.find(s => s.servicesID === selectedServices[0]);
      const isFirstServiceCarpet = firstSelectedService?.advancedTime === true;
      
      if (isServiceCarpet !== isFirstServiceCarpet) {
        setMessage(currentLang === "ar" ? "لا يمكن مزج منتجات مختلفة" : "Cannot mix different product types");
        setTimeout(() => setMessage(""), 1900);
        return;
      }
    }
    
    setSelectedServices(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  const handleQuantityChange = (id, type) => {
    const updatedServices = services.map((item) => {
      if (item.servicesID === id) {
        const newQuantity = type === 1
          ? item.quantity + 1
          : item.quantity > 1
            ? item.quantity - 1
            : 1;

        const newTotalPrice = item.unitPrice * newQuantity;

        return {
          ...item,
          quantity: newQuantity,
          totalPrice: newTotalPrice,
        };
      }
      return item;
    });

    setServices(updatedServices);
    console.log(id, type);

  };

  const handelAllTotal = () => {
    const total = services
      .filter((service) => selectedServices.includes(service.servicesID))
      .reduce((acc, curr) => acc + (curr.unitPrice * curr.quantity), 0);
    return total;
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessageType("")

    // Phone Validation: numbers only and >= 5 digits
    const phoneStr = String(phone || "").trim();
    const isOnlyNumbers = /^\d+$/.test(phoneStr);

    if (!phoneStr || !isOnlyNumbers || phoneStr.length < 5) {
      setMessageType(currentLang === "ar" ? "يرجى إدخال رقم هاتف صحيح (5 أرقام على الأقل)" : "Please enter a valid phone number (at least 5 digits)");
      return;
    }

    if (!address.trim()) {
      setMessageType(currentLang === "ar" ? "يرجى إدخال العنوان" : "Please enter your address");
      return;
    }

    const selected = services.filter(serv => selectedServices.includes(serv.servicesID));

   const filterProducts = selected.filter(serv => serv.advancedTime === true);

    if (filterProducts.length > 0) {
      const req = {
      personId: parseFloat(userId),
      phoneNumberPlus: phoneStr,
      addressPlus: address,
      totalAmount: handelAllTotal(),
      services: filterProducts.map((ele) => ({
        servicesID: ele.servicesID,
        quantity: ele.quantity,
        unitPrice: ele.unitPrice
      }))
      };
      createOrderAdvancedTime(req);
      return;
     } 

    const payload = {
      personId: parseFloat(userId),
      phoneNumberPlus: phoneStr,
      addressPlus: address,
      totalAmount: handelAllTotal(),
      services: selected.map((ele) => ({
        servicesID: ele.servicesID,
        quantity: ele.quantity,
        unitPrice: ele.unitPrice
      }))
    };
    try {
      const res = await axios.post("https://laundryar7.runasp.net/api/Laundry/CreateOrder", payload);
      setPhone("")
      setAddress("")
      setToggle(!toggle);
      setMessage(currentLang === "ar" ? "تم إضافة الطلب بنجاح" : "Order placed successfully!")
      setSelectedServices([])
    } catch (error) {
      console.log(error);
    }
  }

  const createOrderAdvancedTime = async (payload) => {
    console.log(payload);
    
     try {
      const res = await axios.post("https://laundryar7.runasp.net/api/Laundry/CreateOrderAdvancdTime", payload);
      setPhone("")
      setAddress("")
      setToggle(!toggle);
      setMessage(currentLang === "ar" ? "تم إضافة الطلب بنجاح" : "Order placed successfully!")
      setSelectedServices([])
    } catch (error) {
      console.log(error);
    }
  }

  const handelMessage = () => {
    setTimeout(() => {
      setMessage("")
    }, 1900)
  }

  const currentEditingService = services.find(s => s.servicesID === editingService);

  const getFilteredServices = () => {
    if (filterType === "carpet") {
      return services.filter(service => service.advancedTime === true);
    } else if (filterType === "normal") {
      return services.filter(service => service.advancedTime === false || service.advancedTime === null);
    }
    return services; 
  };



  if (loading) {
    return (
      <div className="coustom_container">
        <p className="text-lg text-center text-gray-600 mt-10">
          {currentLang === "ar" ? " جاري التحميل " : "Loading..."}
        </p>
      </div>
    )
  }

  return (
    <div className="dark:bg-gray-800">
      <div dir={currentLang === "ar" ? "rtl" : "ltr"} className={`${toggle ? "visible" : "invisible"} transition bg-[#00000096] fixed w-full h-full top-0 left-0 z-40 backdrop-blur-sm`}></div>
      <p className={`${message ? " visible opacity-100 translate-y-0" : " invisible opacity-0 -translate-y-5"} 
        duration-200  fixed top-28 left-1/2 -translate-x-1/2 bg-blue-400 text-white font-bold p-4 rounded-xl z-50`}>{message ? message : ""}</p>
      <div className={`
           ${toggle ? " scale-100" : " scale-0"}
             transition fixed z-50  bg-[#EEE] dark:bg-gray-900 py-9 px-6 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 lg:w-[55%] w-[95%] rounded-xl shadow-2xl border-2 border-white/50 dark:border-gray-700`}>
        <FaXmark onClick={toggleChange} className=" absolute top-5 right-5 cursor-pointer transition text-gray-600 dark:text-gray-400 hover:text-blue-500" size={25} />
        <h3 className="text-center text-3xl mb-5 pb-4 font-semibold dark:text-gray-100"> {t("orders.create")} </h3>
        <p className={`text-red-500/50 font-bold z-40
          mb-2 ${currentLang === "ar" ? "text-right" : "text-left"}
          `}>{messageType ? messageType : ""}</p>
        <form
          onSubmit={handleSubmit}
          className="text-center">
          <div className="mb-4 last:mb-0">
            <label htmlFor="userPhone" className={`block text-lg font-semibold mb-2 dark:text-gray-300 ${currentLang === "ar" ? "text-right" : "text-left"}`}>{t("auth.phone")}</label>
            <input
              className={`px-4 py-3 rounded-xl w-full placeholder:text-lg placeholder:duration-200 focus:placeholder:opacity-0 outline-none border border-transparent focus:border-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-700 ${currentLang === "ar" ? "text-right" : "text-left"}`}
              type="text"
              id="userPhone"
              placeholder={t("auth.phone")}
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="mb-4 last:mb-0">
            <label htmlFor="add" className={`block text-lg font-semibold mb-2 dark:text-gray-300 ${currentLang === "ar" ? "text-right" : "text-left"}`}>{t("auth.address")}</label>
            <input
              className={`px-4 py-3 rounded-xl w-full placeholder:text-lg placeholder:duration-200 focus:placeholder:opacity-0 outline-none border border-transparent focus:border-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-700 ${currentLang === "ar" ? "text-right" : "text-left"}`}
              type="text"
              id="add"
              placeholder={t("auth.address")}
              name="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <button onClick={handelMessage} type="submit" className="bg-blue-500 py-3 px-4 rounded-xl text-white lg:w-36 w-full text-lg cursor-pointer mt-3">  {t("orders.create")} </button>
        </form>
      </div>
    

      {/* Quantity Modal */}
      <div dir={currentLang === "ar" ? "rtl" : "ltr"} className={`${qtyModal ? "visible" : "invisible"} transition bg-[#00000096] fixed w-full h-full top-0 left-0 z-[60] backdrop-blur-sm`}></div>
      <div className={`
           ${qtyModal ? " scale-100" : " scale-0"}
             transition fixed z-[70] bg-[#EEE] dark:bg-gray-900 py-9 px-6 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 lg:w-[40%] w-[90%] rounded-[35px] shadow-2xl border-2 border-white/50 dark:border-gray-700`}>
        <FaXmark onClick={() => setQtyModal(false)} className=" absolute top-5 right-5 cursor-pointer transition text-gray-600 dark:text-gray-400 hover:text-blue-500" size={25} />

        {currentEditingService && (
          <div className="text-center">
            <div className="w-24 h-24 bg-[#0D54A0]/20 dark:bg-blue-900/40 rounded-3xl mx-auto mb-4 flex items-center justify-center">
              <MdLocalLaundryService size={60} className="text-[#0D54A0] dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-[#1E5FAC] dark:text-blue-400 mb-2">{currentEditingService.servicesName}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 font-semibold">
              {currentEditingService.unitPrice} {currentLang === "ar" ? "ج.م" : "EGP"} / {currentLang === "ar" ? "قطعة" : "unit"}
            </p>
            

            <div className="flex items-center justify-center gap-6 mb-8">
              <button
                type="button"
                onClick={() => handleQuantityChange(currentEditingService.servicesID, 0)}
                className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FaMinus size={20} />
              </button>

              <span className="text-3xl font-bold min-w-[50px] dark:text-gray-100">{currentEditingService.quantity}</span>

              <button
                type="button"
                onClick={() => handleQuantityChange(currentEditingService.servicesID, 1)}
                className="w-12 h-12 rounded-full bg-[#0D54A0] shadow-md flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
              >
                <FaPlus size={20} />
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 shadow-inner flex justify-between items-center px-8 border border-transparent dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 font-bold">{currentLang === "ar" ? "الإجمالي" : "Total"}</span>
              <span className="text-2xl font-bold text-[#0D54A0] dark:text-blue-400">
                {(currentEditingService.unitPrice || 0) * (currentEditingService.quantity || 1)} {currentLang === "ar" ? "ج.م" : "EGP"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => confirmService(currentEditingService.servicesID)}
              className="bg-[#0D54A0] text-white py-4 px-10 rounded-2xl text-xl font-bold w-full shadow-lg hover:scale-[1.02] transition-transform active:scale-95"
            >
              {selectedServices.includes(currentEditingService.servicesID) ? (currentLang === "ar" ? "تعديل الكمية" : "Update Quantity") : (currentLang === "ar" ? "إضافة للسلة" : "Add to Bag")}
            </button>
          </div>
        )}
      </div>

      <div className="coustom_container">
        <div className="md:py-16 py-8"
        dir={currentLang === "ar" ? "rtl" : "ltr"}
        >
          <h3 className="text-center text-4xl mb-6 pb-6 font-semibold text-[#1E5FAC] dark:text-blue-400" >  الخدمات  Servic<span className="">es</span> </h3>
           <div 
           dir={currentLang === "ar" ? "rtl" : "ltr"}
           className="flex items-center gap-4 mb-8 flex-wrap"
           >
            <div className="flex items-center gap-2 p-2 bg-[#1E5FAC] rounded-xl text-white font-bold cursor-pointer hover:bg-blue-600 transition
            relative"
            onClick={() => setShowFilter(!showFilter)}
            >
              <MdFilterAlt size={28}/>
              <span className="text-lg font-medium">{currentLang === "ar" ? "فلترة الخدمات" : "Filter Services"}</span>

              {showFilter && (
                <ul className={`absolute top-full ${currentLang === "ar" ? "right-0" : "left-0"} mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg w-48 z-50
                p-2`}>
                  <li>
                    <button
                      onClick={() => setFilterType("normal")}
                      className={`px-4 py-1.5 rounded-xl font-bold text-lg transition w-full mb-2.5 ${
                        filterType === "normal"
                          ? "bg-[#1E5FAC] text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      {currentLang === "ar" ? "منتجات عادية" : "Normal Products"}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setFilterType("carpet")}
                      className={`px-4 py-1.5  rounded-xl font-bold text-lg transition w-full ${
                        filterType === "carpet"
                          ? "bg-[#1E5FAC] text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      {currentLang === "ar" ? "منتجات سجاد" : "Carpet Products"}
                    </button>
                  </li>
                </ul>
              )}
            </div>

           </div>

          <section className="m-auto w-full " >

            <div className="w-full">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                {getFilteredServices().map((ele) => (
                  <div key={ele.servicesID} className="flex flex-col gap-1 items-center">
                    <div className="relative w-full max-w-[160px]">
                      <div className={`
                          relative aspect-square bg-[#0D54A0]/20 dark:bg-blue-900/40 rounded-[25px] border-2 transition-all duration-300
                          flex items-center justify-center overflow-hidden
                          ${selectedServices.includes(ele.servicesID) ? "border-[#0D54A0] dark:border-blue-400 shadow-lg scale-[1.05]" : "border-transparent dark:border-gray-700"}
                        `}>
                        <MdLocalLaundryService size="85%" className="text-[#0D54A0] dark:text-blue-400 opacity-80" />

                        <button
                          onClick={() => {
                            toggleQtyModal(ele.servicesID)
                          }}
                          className={`
                              absolute bottom-2 right-2 w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all duration-300 shadow-md z-10
                              ${selectedServices.includes(ele.servicesID) ? "bg-green-500" : "bg-[#0D54A0] animate-pulse-custom"}
                            `}
                        >
                          {selectedServices.includes(ele.servicesID) ? <span className="font-bold text-sm">{ele.quantity}</span> : <FaPlus size={14} />}
                        </button>

                        {selectedServices.includes(ele.servicesID) && (
                          <button
                            type="button"
                            onClick={() => {
                              toggleServiceSelection(ele.servicesID);
                              setQtyModal(false);
                            }}
                            className="absolute top-1.5 left-1.5 w-7 h-7 rounded-xl bg-red-500 flex items-center justify-center text-white transition-all duration-300 shadow-md z-30"
                          >
                            <IoClose size={20} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-center mt-1">
                      <h4 className="text-[#1E5FAC] dark:text-blue-400 font-bold text-sm md:text-base line-clamp-1">
                        {ele.servicesName}
                      </h4>
                      <p className="text-[#0D54A0] dark:text-blue-300 font-bold text-xs md:text-sm opacity-80">
                        {ele.unitPrice} {currentLang === "ar" ? "ج.م" : "EGP"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {filterType === "carpet" && getFilteredServices().length > 0 && (
                <p
                className="text-lg text-red-800 dark:bg-gray-900 bg-[#0D54A0]/30
                p-3 rounded-lg mt-6 font-semibold w-fit"
                > **{currentLang === "ar" ? 
                  "يرجى العلم أن هذا النوع من المنتجات يتم تجهيزه بعد الطلب، لذلك سيصل خلال 9 أيام من تاريخ الطلب" 
                  : "Please note that this type of product is prepared after ordering; therefore, it will be delivered within 9 days from the order date"} </p>
              )}
            </div>
          </section>
          <div className="mt-10 pt-4 flex flex-col justify-center items-center gap-6">

            <div className="flex items-center justify-center lg:flex-row flex-col gap-8 
              bg-[#0D54A0]/30 dark:bg-gray-900 p-4 md:w-[75%] h-45 w-full rounded-3xl">
              <div className="bg-[#0D54A0] text-white text-2xl font-bold py-3 px-12 rounded-full shadow-lg flex items-center justify-center gap-4 min-w-[300px]">
                <span>{t("orders.allTotal")}</span>
                <span>{handelAllTotal()} {currentLang === "ar" ? "ج.م" : "EGP"}</span>
              </div>

              <button
                className={`block ${selectedServices.length > 0 ? "visible opacity-100" : "invisible opacity-0"} transition-all duration-300 bg-[#0D54A0] text-white text-2xl font-bold py-3 px-12 rounded-full shadow-lg flex items-center justify-center gap-4 min-w-[300px]`}
                onClick={() => {
                  toggleChange()
                }}
              > {t("orders.create")}</button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
