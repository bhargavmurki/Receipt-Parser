import Foundation
import UIKit

enum ImageProcessing {
    static func compressedJPEGData(from image: UIImage, maxDimension: CGFloat = 2200, compression: CGFloat = 0.78) -> Data? {
        let resized = resizedImage(image, maxDimension: maxDimension)
        return resized.jpegData(compressionQuality: compression)
    }

    private static func resizedImage(_ image: UIImage, maxDimension: CGFloat) -> UIImage {
        let size = image.size
        let maxCurrentDimension = max(size.width, size.height)
        guard maxCurrentDimension > maxDimension else { return image }

        let scale = maxDimension / maxCurrentDimension
        let targetSize = CGSize(width: size.width * scale, height: size.height * scale)

        let renderer = UIGraphicsImageRenderer(size: targetSize)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: targetSize))
        }
    }
}
