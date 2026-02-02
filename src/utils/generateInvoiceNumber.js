const generateInvoiceNumber = () => {
  return `INV-${Date.now()}`;
};

export default generateInvoiceNumber;
