package ibm.rules.purchase;

import java.util.ArrayList;
import java.util.List;

public class Customer implements java.io.Serializable
{
	
	private String customerId;
	private Purchase purchase;
	private int discount;
	private String discountReason;
	
	public String getDiscountReason() {
		return discountReason;
	}

	public void setDiscountReason(String discountReason) {
		this.discountReason = discountReason;
	}

	private List<Purchase> purchaseHistory = new ArrayList<Purchase>();

	public String getCustomerId() {
		return customerId;
	}

	public void setCustomerId(String customerId) {
		this.customerId = customerId;
	}

	public Purchase getPurchase() {
		return purchase;
	}

	public void setPurchase(Purchase purchase) {
		this.purchase = purchase;
	}

	public int getDiscount() {
		return discount;
	}

	public void setDiscount(int discount) {
		this.discount = discount;
	}

	public List<Purchase> getPurchaseHistory() {
		return purchaseHistory;
	}
	
	public void addPurchaseHistory(Purchase purchase) {
		purchaseHistory.add(purchase);
	}	
	
	@Override
	public String toString() {
		return "Customer [customerId=" + customerId + ", purchase=" + purchase
				+ ", discount=" + discount + ", purchaseHistory="
				+ purchaseHistory + "]";
	}

}
