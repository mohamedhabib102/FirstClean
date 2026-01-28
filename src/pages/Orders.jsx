import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../Components/context/AuthContext";
import { useTranslation } from "react-i18next";
import { FaXmark, FaCircleInfo } from "react-icons/fa6";
import { FaBoxOpen } from "react-icons/fa";
import { MdLocalLaundryService } from "react-icons/md";
import { IoCalendarOutline, IoTimeOutline, IoDocumentTextOutline } from "react-icons/io5";
import { SiTrueup } from "react-icons/si";



export default function Orders() {
  const { userId } = useAuth();
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("")
  const [loadingOrderId, setLoadingOrderId] = useState(null);
  const [loading, setLoading] = useState(true)


  const getAllOrders = async () => {
    const id = parseFloat(userId);
    try {
      setLoading(true)
      const res = await axios.get(`https://laundryar7.runasp.net/api/Laundry/GetOrderByID/${id}`);
      setOrders(Array.isArray(res.data) ? res.data : [res.data]);
    } catch (error) {
      // Treat 404 (no orders) as an empty list to avoid breaking the UI
      if (error?.response?.status === 404) {
        setOrders([]);
      } else {
        console.log(error);
      }
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    if (!userId) return;
    getAllOrders();
  }, [userId]);

  const currentLang = i18n.language;

  const handleChangeStatus = async (orderId, currentStatus = "Cancel") => {
    try {
      const res = await axios.put(`https://laundryar7.runasp.net/api/Laundry/UpdateStatus`, {
        orderId,
        status: currentStatus,
        regectionReason: ""
      });
      setOrders(prev =>
        prev.map(order =>
          order.orderID === orderId ? { ...order, status: currentStatus } : order
        )
      );
      setMessage(t("orders.statusNow"))
      handelMessage()
      console.log(res);

    } catch (err) {
      console.log(err);
    }
  };

  const handelMessage = () => {
    setTimeout(() => {
      setMessage("")
    }, 1900)
  }

  const handleAction = async (orderId) => {
    setLoadingOrderId(orderId);

    try {

      await handleChangeStatus(orderId);

    } catch (error) {
      console.log(error);
    } finally {
      setLoadingOrderId(null);
    }
  };


  if (loading) {
    return (
      <div className="coustom_container">
        <p className="text-center text-gray-600 dark:text-gray-400 mt-20 text-xl font-bold animate-pulse">
          {currentLang === "ar" ? " جاري التحميل ... " : "Loading Orders..."}
        </p>
      </div>
    )
  }

  return (
    <div className="coustom_container">
      <p className={`${message ? " visible opacity-100 translate-y-0" : " invisible opacity-0 -translate-y-5"} 
        duration-200  fixed top-28 left-1/2 -translate-x-1/2 bg-[#1E5FAC] text-white font-bold p-4 rounded-xl z-[100] shadow-2xl`}>
        {message ? message : ""}
      </p>

      <div className="md:py-16 py-8">
        <h3 className="text-center text-4xl mb-4 font-black text-[#1E5FAC] dark:text-blue-400">
          {currentLang === "ar" ? " طلباتي " : "My Orders"}
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-12 font-medium">
          {currentLang === "ar" ? "تابع حالة طلباتك لحظة بلحظة" : "Follow your orders status step by step"}
        </p>

        <section className="mx-auto" dir={currentLang === "ar" ? "rtl" : "ltr"}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {[...orders].reverse().map((order) => (
              <div key={order.orderID} className="group flex flex-col bg-white dark:bg-gray-900 rounded-[40px] shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-800 overflow-hidden relative">

                {/* Header Decoration */}
                <div className="h-16 bg-[#1E5FAC]/10 dark:bg-blue-900/20 relative overflow-hidden">
                  <MdLocalLaundryService size={120} className="absolute -right-8 -top-8 text-[#1E5FAC] opacity-10 rotate-45" />
                  <div className="absolute inset-0 flex items-center justify-between px-8">
                    <span className="bg-[#1E5FAC] text-white px-4 py-1 rounded-full text-sm font-black shadow-md">
                      #{order.orderID}
                    </span>
                    <div className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm 
                      ${(order.status === "refused" || order.status === "ملغي")
                        ? "bg-red-100 text-red-500 border border-red-200"
                        : order.status === "تم التوصيل"
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : "bg-blue-50 text-[#1E5FAC] border border-blue-100"
                      }`}>
                      {order.status === "refused" ? "مرفوض" : order.status === "Pending" ? 
                      currentLang === "ar" ? "قيد الانتظار" : "Pending"
                      : order.status}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 flex-grow">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-[#1E5FAC]/10 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                      <MdLocalLaundryService size={30} className="text-[#1E5FAC] dark:text-blue-400" />
                    </div>
                    <h4 className="text-2xl font-black text-gray-800 dark:text-gray-100 leading-tight">
                      {order.name}
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <IoCalendarOutline size={20} className="text-[#1E5FAC] dark:text-blue-400 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase">{t("ordersTable.orderDate")}</span>
                        <span className="text-gray-700 dark:text-gray-300 font-bold">{new Date(order.orderDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <IoTimeOutline size={20} className="text-[#1E5FAC] dark:text-blue-400 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase">{t("ordersTable.deliveryDate")}</span>
                        <p className="text-gray-700 dark:text-gray-300 font-bold">
                          {new Date(order.deliveryDate).toLocaleDateString()}
                          <span className="block text-xs text-blue-500 dark:text-blue-400 mt-0.5">
                            {t("orders.max_delivery_time")}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <IoDocumentTextOutline size={20} className="text-[#1E5FAC] dark:text-blue-400 flex-shrink-0" />
                      <div className="flex flex-col gap-1">
                        <div>
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase">{t("ordersTable.total")}</span>
                          <p className="text-lg font-black text-[#1E5FAC] dark:text-blue-400">
                            {order.totalAmount} {currentLang === "ar" ? "ج.م" : "EGP"}
                          </p>
                        </div>
                        
                        {order.deliveryFee > 0 && (
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-1">
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase">
                              {currentLang === "ar" ? "رسوم التوصيل" : "Delivery Fee"}
                            </span>
                            <p className="text-base font-bold text-green-600 dark:text-green-400">
                              {order.deliveryFee} {currentLang === "ar" ? "ج.م" : "EGP"}
                            </p>
                          </div>
                        )}

                        {order.finalTotal > 0 && (
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-1 bg-[#1E5FAC]/10 dark:bg-blue-900/30 -mx-3 px-3 py-1 rounded">
                            <span className="text-xs text-[#1E5FAC] dark:text-blue-400 font-bold uppercase">
                              {currentLang === "ar" ? "الإجمالي النهائي" : "Final Total"}
                            </span>
                            <p className="text-lg font-black text-[#1E5FAC] dark:text-blue-400">
                              {order.finalTotal} {currentLang === "ar" ? "ج.م" : "EGP"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {order.refusedReason && (
                      <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/30">
                        <p className="text-red-500 dark:text-red-400 font-bold text-xs mb-1 uppercase">{t("ordersTable.rejectionReason")}:</p>
                        <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">{order.refusedReason}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer / Action */}
                <div className="px-8 pb-8">
                  {(() => {
                    const isDisable =
                      loadingOrderId === order.orderID ||
                      ["refused", "ملغي", "تم التوصيل", "جاري الاستلام من العميل", "تم الاستلام بواسطه المغسله", "جاري التوصيل للعميل"].includes(order.status);

                    return (
                      <button
                        onClick={() => handleAction(order.orderID)}
                        disabled={isDisable}
                        className={`
                          w-full lg:py-3 py-1.5 lg:rounded-2xl rounded-lg font-black text-lg transition-all duration-300 shadow-lg
                          ${isDisable
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed shadow-none"
                            : "bg-red-500 hover:bg-red-600 text-white hover:scale-[1.02] active:scale-95"
                          }
                        `}
                      >
                        {loadingOrderId === order.orderID
                          ? <SiTrueup size={24} className="mx-auto animate-spin" />
                          : (order.status === "refused" || order.status === "ملغي"
                            ? (currentLang === "ar" ? "تم الإلغاء" : "Cancelled")
                            : order.status === "تم التوصيل"
                              ? (currentLang === "ar" ? "مكتمل" : "Completed")
                              : t("orders.cancelNow"))
                        }
                      </button>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>

          {orders.length === 0 && (
            <div className="text-center py-24 bg-gray-50 dark:bg-gray-900/50 rounded-[50px] border-4 border-dashed border-gray-100 dark:border-gray-800">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaBoxOpen size={40} className="text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-gray-400 dark:text-gray-500 text-2xl font-black">
                {currentLang === "ar" ? "لا يوجد طلبات حالياً" : "No orders yet"}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
