package ibm.rules.purchase;

import java.util.Date;

public class Purchase implements java.io.Serializable
{

	private String product;
	private int price;
	private Date purchaseTimestamp;
	
	public String getProduct() {
		return product;
	}
	
	

	public Purchase(String product, int price, Date purchaseTimestamp) {
		super();
		this.product = product;
		this.price = price;
		this.purchaseTimestamp = purchaseTimestamp;
	}



	public void setProduct(String product) {
		this.product = product;
	}

	public int getPrice() {
		return price;
	}

	public void setPrice(int price) {
		this.price = price;
	}

	public Date getPurchaseTimestamp() {
		return purchaseTimestamp;
	}

	public void setPurchaseTimestamp(Date purchaseTimestamp) {
		this.purchaseTimestamp = purchaseTimestamp;
	}

	public Purchase() {
		super();
	}

	@Override
	public String toString() {
		return "Purchase [product=" + product + ", price=" + price
				+ ", purchaseTimestamp=" + purchaseTimestamp + "]";
	}
	
	

}
