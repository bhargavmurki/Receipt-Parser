import Foundation

struct User: Codable, Equatable, Hashable {
    let id: String?
    let email: String?
    let name: String
    let provider: String?
}

struct Receipt: Codable, Identifiable, Equatable, Hashable {
    let id: String
    var name: String
    var date: String
    let createdAt: String?
    let updatedAt: String?
    var total: Double
    var subtotal: Double?
    var taxAmount: Double?
    var items: [ReceiptItem]
}

struct ReceiptItem: Codable, Identifiable, Equatable, Hashable {
    let id: UUID
    var description: String
    var quantity: Double
    var price: Double
    var totalPrice: Double
    var isWeighted: Bool

    init(id: UUID = UUID(), description: String, quantity: Double, price: Double, totalPrice: Double, isWeighted: Bool) {
        self.id = id
        self.description = description
        self.quantity = quantity
        self.price = price
        self.totalPrice = totalPrice
        self.isWeighted = isWeighted
    }

    enum CodingKeys: String, CodingKey {
        case id
        case description
        case quantity
        case price
        case totalPrice
        case isWeighted
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        // If `id` is missing in payload, generate a new one to keep Identifiable stable in-memory
        self.id = try container.decodeIfPresent(UUID.self, forKey: .id) ?? UUID()
        self.description = try container.decode(String.self, forKey: .description)
        self.quantity = try container.decode(Double.self, forKey: .quantity)
        self.price = try container.decode(Double.self, forKey: .price)
        self.totalPrice = try container.decode(Double.self, forKey: .totalPrice)
        self.isWeighted = try container.decode(Bool.self, forKey: .isWeighted)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(description, forKey: .description)
        try container.encode(quantity, forKey: .quantity)
        try container.encode(price, forKey: .price)
        try container.encode(totalPrice, forKey: .totalPrice)
        try container.encode(isWeighted, forKey: .isWeighted)
    }

    static func == (lhs: ReceiptItem, rhs: ReceiptItem) -> Bool {
        lhs.id == rhs.id &&
        lhs.description == rhs.description &&
        lhs.quantity == rhs.quantity &&
        lhs.price == rhs.price &&
        lhs.totalPrice == rhs.totalPrice &&
        lhs.isWeighted == rhs.isWeighted
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
        hasher.combine(description)
        hasher.combine(quantity)
        hasher.combine(price)
        hasher.combine(totalPrice)
        hasher.combine(isWeighted)
    }
}

struct ReceiptListResponse: Codable {
    let receipts: [Receipt]
}

struct ReceiptResponse: Codable {
    let receipt: Receipt
}

struct AuthResponse: Codable {
    let user: User
    let token: String
}

struct VerifyResponse: Codable {
    let valid: Bool
    let user: User
}

struct APIErrorResponse: Codable {
    let error: String?
    let message: String?
    let code: String?
}

struct ReceiptDraft: Identifiable, Equatable, Hashable {
    let id: String
    var name: String
    var date: Date
    var subtotal: Double?
    var taxAmount: Double?
    var total: Double
    var items: [ReceiptItem]

    init(receipt: Receipt) {
        id = receipt.id
        name = receipt.name
        total = receipt.total
        subtotal = receipt.subtotal
        taxAmount = receipt.taxAmount
        items = receipt.items

        let formatter = ISO8601DateFormatter()
        date = formatter.date(from: receipt.date) ?? Date()
    }

    static func == (lhs: ReceiptDraft, rhs: ReceiptDraft) -> Bool {
        lhs.id == rhs.id &&
        lhs.name == rhs.name &&
        lhs.date == rhs.date &&
        lhs.subtotal == rhs.subtotal &&
        lhs.taxAmount == rhs.taxAmount &&
        lhs.total == rhs.total &&
        lhs.items == rhs.items
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
        hasher.combine(name)
        hasher.combine(date)
        hasher.combine(subtotal)
        hasher.combine(taxAmount)
        hasher.combine(total)
        hasher.combine(items)
    }
}
