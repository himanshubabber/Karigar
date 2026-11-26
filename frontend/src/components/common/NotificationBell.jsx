import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaBell,
  FaCheckDouble,
  FaKey,
  FaClipboardList,
  FaRupeeSign,
  FaCommentAlt,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimes,
} from "react-icons/fa";

const NotificationBell = ({
  role = "admin",
  apiBaseUrl = import.meta.env.VITE_API_URL || "https://karigarbackend.vercel.app",
  authHeaders = {},
  extraNotifications = [],
  onNavigate,
  isDark = false,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("all"); // 'all' | 'unread'
  const [dbNotifications, setDbNotifications] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Combine DB notifications with extra contextual notifications passed as props
  const allNotifications = [
    ...extraNotifications.map((n) => ({
      ...n,
      isRead: readIds.has(n._id) || n.isRead,
    })),
    ...dbNotifications.map((n) => ({
      ...n,
      isRead: readIds.has(n._id) || n.isRead,
    })),
  ];

  const unreadCount = allNotifications.filter((n) => !n.isRead).length;

  const filteredNotifications =
    filter === "unread"
      ? allNotifications.filter((n) => !n.isRead)
      : allNotifications;

  // Fetch from backend
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      let recipientIdParam = "";
      try {
        const storedUser =
          localStorage.getItem("karigar_customer") ||
          localStorage.getItem("karigar_worker") ||
          localStorage.getItem("user") ||
          localStorage.getItem("customer") ||
          localStorage.getItem("worker") ||
          localStorage.getItem("admin");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed._id) recipientIdParam = `&recipientId=${parsed._id}`;
        }
      } catch {
        // ignore JSON parse error
      }

      const res = await axios.get(
        `${apiBaseUrl}/api/v1/notifications?role=${role}${recipientIdParam}`,
        {
          headers: authHeaders,
          withCredentials: true,
        }
      );
      if (res.data?.data?.notifications) {
        setDbNotifications(res.data.data.notifications);
      }
    } catch {
      // Clean fallback if backend notifications collection is empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [role]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (notif) => {
    setReadIds((prev) => new Set([...prev, notif._id]));
    try {
      if (notif._id && !notif._id.startsWith("local-")) {
        await axios.patch(
          `${apiBaseUrl}/api/v1/notifications/${notif._id}/read`,
          {},
          { headers: authHeaders, withCredentials: true }
        );
      }
    } catch (e) {
      console.error("Mark read error:", e);
    }

    // Extract full 24-char serviceRequestId from link or message if present
    const idFromLink = (notif.link || "").match(/serviceRequestId=([0-9a-fA-F]{24})/);
    const idFromMsg = (notif.message || "").match(/[#\s]([0-9a-fA-F]{24})/);
    const extractedServiceId = idFromLink ? idFromLink[1] : idFromMsg ? idFromMsg[1] : null;

    if (extractedServiceId) {
      try {
        localStorage.setItem("serviceRequestId", extractedServiceId);
      } catch (err) {
        console.error("Failed to set serviceRequestId in localStorage:", err);
      }
    }

    if (onNavigate) {
      onNavigate(notif.link);
    } else if (notif.link && notif.link.startsWith("/")) {
      navigate(notif.link);
    } else if (extractedServiceId) {
      if (role === "customer") {
        navigate(`/location_user?serviceRequestId=${extractedServiceId}`);
      } else if (role === "worker") {
        navigate(`/location_worker?serviceRequestId=${extractedServiceId}`);
      }
    }
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    const allIds = allNotifications.map((n) => n._id);
    setReadIds(new Set(allIds));
    try {
      await axios.patch(
        `${apiBaseUrl}/api/v1/notifications/read-all`,
        { role },
        { headers: authHeaders, withCredentials: true }
      );
    } catch (e) {
      console.error("Mark all read error:", e);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "request":
      case "elevation":
        return <FaKey className="text-warning" />;
      case "order":
        return <FaClipboardList className="text-primary" />;
      case "quote":
        return <FaRupeeSign className="text-success" />;
      case "comment":
        return <FaCommentAlt className="text-info" />;
      case "alert":
        return <FaExclamationTriangle className="text-danger" />;
      default:
        return <FaInfoCircle className="text-secondary" />;
    }
  };

  return (
    <div className="position-relative d-inline-block" ref={dropdownRef} style={{ zIndex: 1250 }}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`btn position-relative d-flex align-items-center justify-content-center p-2 rounded-circle border-0 ${
          isDark
            ? "btn-dark text-white bg-dark bg-opacity-50"
            : "btn-light text-dark bg-white shadow-sm border"
        }`}
        style={{
          width: 38,
          height: 38,
          transition: "transform 0.15s ease",
          zIndex: 1250,
        }}
        title="View Notifications"
        aria-label="Notifications"
      >
        <FaBell size={18} className={unreadCount > 0 ? "text-primary" : "text-secondary"} />
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: "10px", padding: "3px 6px" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
            <span className="visually-hidden">unread notifications</span>
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          className="position-absolute end-0 mt-2 bg-white rounded-4 shadow-lg border-0 overflow-hidden"
          style={{
            width: "min(90vw, 360px)",
            maxHeight: "85vh",
            zIndex: 9999,
            fontFamily: "Inter, sans-serif",
            animation: "fadeIn 0.2s ease-in-out",
          }}
        >
          {/* Header */}
          <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <FaBell className="text-primary" />
              <h6 className="mb-0 fw-bold text-dark">Notifications</h6>
              {unreadCount > 0 && (
                <span className="badge bg-primary rounded-pill small">{unreadCount} New</span>
              )}
            </div>
            <div className="d-flex align-items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none p-0 text-muted small me-2"
                  onClick={handleMarkAllAsRead}
                  title="Mark all as read"
                >
                  <FaCheckDouble className="me-1 text-primary" /> Mark all read
                </button>
              )}
              <button
                type="button"
                className="btn btn-sm btn-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              ></button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="d-flex px-3 pt-2 pb-1 border-bottom gap-2 bg-white">
            <button
              type="button"
              className={`btn btn-sm py-1 px-3 rounded-pill border-0 ${
                filter === "all" ? "btn-primary" : "btn-light text-muted"
              }`}
              style={{ fontSize: "12px" }}
              onClick={() => setFilter("all")}
            >
              All ({allNotifications.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm py-1 px-3 rounded-pill border-0 ${
                filter === "unread" ? "btn-primary" : "btn-light text-muted"
              }`}
              style={{ fontSize: "12px" }}
              onClick={() => setFilter("unread")}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {filteredNotifications.length > 0 ? (
              <div className="list-group list-group-flush">
                {filteredNotifications.map((notif) => {
                  const isRead = notif.isRead;
                  return (
                    <div
                      key={notif._id}
                      onClick={() => handleMarkAsRead(notif)}
                      className={`list-group-item list-group-item-action p-3 d-flex align-items-start gap-3 border-bottom transition-all ${
                        isRead ? "bg-white text-muted" : "bg-primary bg-opacity-10"
                      }`}
                      style={{ cursor: "pointer" }}
                    >
                      <div
                        className="rounded-circle p-2 bg-white shadow-sm d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: 34, height: 34 }}
                      >
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <strong
                            className={`small mb-0 text-truncate ${
                              isRead ? "text-secondary" : "text-dark fw-bold"
                            }`}
                            style={{ maxWidth: "190px" }}
                          >
                            {notif.title}
                          </strong>
                          {!isRead && (
                            <span
                              className="rounded-circle bg-primary flex-shrink-0"
                              style={{ width: 8, height: 8 }}
                            ></span>
                          )}
                        </div>
                        <p
                          className="small text-secondary mb-1"
                          style={{
                            fontSize: "12px",
                            lineHeight: "1.4",
                            wordBreak: "break-word",
                          }}
                        >
                          {notif.message}
                        </p>
                        <small className="text-muted" style={{ fontSize: "10px" }}>
                          {notif.createdAt
                            ? new Date(notif.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              }) +
                              " • " +
                              new Date(notif.createdAt).toLocaleDateString()
                            : "Just now"}
                        </small>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-5 text-muted">
                <FaBell className="display-6 opacity-25 mb-2 text-secondary" />
                <p className="small mb-0">
                  {filter === "unread" ? "No unread notifications." : "No notifications yet."}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 bg-light border-top text-center">
            <small className="text-muted" style={{ fontSize: "11px" }}>
              Karigar In-App Alert System
            </small>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
