import Foundation

enum APIClientError: LocalizedError {
    case invalidResponse
    case unauthorized
    case server(String)
    case encodingFailed

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "The server returned an invalid response."
        case .unauthorized:
            return "Your session has expired. Please sign in again."
        case .server(let message):
            return message
        case .encodingFailed:
            return "Failed to prepare request data."
        }
    }
}

final class APIClient {
    static let shared = APIClient()

    private let session: URLSession
    private let configuration: AppConfiguration

    init(session: URLSession = .shared, configuration: AppConfiguration = AppEnvironment.shared) {
        self.session = session
        self.configuration = configuration
    }

    func developmentLogin() async throws -> AuthResponse {
        try await send(path: "auth/dev-login", method: "POST", body: Optional<EmptyPayload>.none)
    }

    func login(email: String, password: String) async throws -> AuthResponse {
        try await send(path: "auth/login", method: "POST", body: ["email": email, "password": password])
    }

    func register(name: String, email: String, password: String) async throws -> RegisterResponse {
        try await send(path: "auth/register", method: "POST", body: ["name": name, "email": email, "password": password])
    }

    func loginWithApple(identityToken: String, firstName: String?, lastName: String?) async throws -> AuthResponse {
        var payload: [String: String] = ["identityToken": identityToken]
        if let firstName {
            payload["firstName"] = firstName
        }
        if let lastName {
            payload["lastName"] = lastName
        }
        return try await send(path: "auth/apple", method: "POST", body: payload)
    }

    func verify(token: String) async throws -> User {
        let response: VerifyResponse = try await send(path: "auth/verify", method: "GET", token: token, body: Optional<EmptyPayload>.none)
        return response.user
    }

    func fetchReceipts(token: String) async throws -> [Receipt] {
        let response: ReceiptListResponse = try await send(path: "receipts", method: "GET", token: token, body: Optional<EmptyPayload>.none)
        return response.receipts
    }

    func deleteReceipt(id: String, token: String) async throws {
        let _: EmptyResponse = try await send(path: "receipts/\(id)", method: "DELETE", token: token, body: Optional<EmptyPayload>.none)
    }

    func logout(token: String) async throws {
        let _: EmptyResponse = try await send(path: "auth/logout", method: "POST", token: token, body: Optional<EmptyPayload>.none)
    }

    func uploadReceipt(imageData: Data, filename: String, token: String) async throws -> Receipt {
        let boundary = UUID().uuidString
        var request = try authorizedRequest(path: "receipts/upload", method: "POST", token: token)
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.httpBody = multipartBody(boundary: boundary, data: imageData, filename: filename)

        let (data, response) = try await session.data(for: request)
        return try decodeResponse(ReceiptResponse.self, data: data, response: response).receipt
    }

    private func multipartBody(boundary: String, data: Data, filename: String) -> Data {
        var body = Data()
        body.append(Data("--\(boundary)\r\n".utf8))
        body.append(Data("Content-Disposition: form-data; name=\"image\"; filename=\"\(filename)\"\r\n".utf8))
        body.append(Data("Content-Type: image/jpeg\r\n\r\n".utf8))
        body.append(data)
        body.append(Data("\r\n--\(boundary)--\r\n".utf8))
        return body
    }

    private func authorizedRequest(path: String, method: String, token: String) throws -> URLRequest {
        guard let url = URL(string: path, relativeTo: configuration.apiBaseURL)?.absoluteURL else {
            throw APIClientError.invalidResponse
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        return request
    }

    private func send<T: Decodable, Body: Encodable>(path: String, method: String, token: String? = nil, body: Body?) async throws -> T {
        guard let url = URL(string: path, relativeTo: configuration.apiBaseURL)?.absoluteURL else {
            throw APIClientError.invalidResponse
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body {
            do {
                request.httpBody = try JSONEncoder().encode(body)
            } catch {
                throw APIClientError.encodingFailed
            }
        }

        let (data, response) = try await session.data(for: request)
        return try decodeResponse(T.self, data: data, response: response)
    }

    private func decodeResponse<T: Decodable>(_ type: T.Type, data: Data, response: URLResponse) throws -> T {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIClientError.invalidResponse
        }

        guard (200..<300).contains(httpResponse.statusCode) else {
            let errorResponse = try? JSONDecoder().decode(APIErrorResponse.self, from: data)
            if httpResponse.statusCode == 401 {
                throw APIClientError.unauthorized
            }
            throw APIClientError.server(errorResponse?.error ?? errorResponse?.message ?? "Request failed.")
        }

        if T.self == EmptyResponse.self {
            return EmptyResponse() as! T
        }

        return try JSONDecoder().decode(type, from: data)
    }
}

struct RegisterResponse: Codable {
    let user: User
}

private struct EmptyResponse: Codable {}
private struct EmptyPayload: Codable {}
