import React from "react";

function Status({ status, style }) {
  const getStatusStyle = (status) => {
    switch (status) {
      case "Необработанное":
      case "Частично необработанное":
      case "ИИ":
      case "404":
        return "text-red-600";
      case "Авторское":
      case "Весенятное":
        return "text-green-600";
      case "Лицензия":
        return "text-blue-600";
      case "В ТЗ":
      case "Запрос клиента":
        return "text-yellow-600";
      case "Исключено":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div
      className={`${getStatusStyle(status)} ${
        style ? style : "text-[13px]"
      } font-bold`}
    >
      {status}
    </div>
  );
}

export default Status;
