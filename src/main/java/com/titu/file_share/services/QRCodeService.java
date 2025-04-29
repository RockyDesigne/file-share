package com.titu.file_share.services;

import com.google.zxing.*;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.codec.binary.Base64OutputStream;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
import java.io.IOException;

@Log4j2
@RequiredArgsConstructor
public class QRCodeService {
    private final Writer qrCodeWriter;

    public String qrCodeImageToBase64String(BitMatrix bitMatrix, String format) throws IOException {

        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();

        MatrixToImageWriter.writeToStream(bitMatrix, "png", byteArrayOutputStream);

        return Base64.encodeBase64String(byteArrayOutputStream.toByteArray());

    }

    public void saveQrCodeToDisk(BitMatrix bitMatrix, String filePath) {
        try (FileOutputStream out = new FileOutputStream(filePath)) {
            MatrixToImageWriter.writeToStream(bitMatrix, "png", out);
        } catch (IOException e) {
            log.error("Could not save bit matrix to :{}", filePath, e);
        }
    }

    public BitMatrix getQrCode(String barCodeData, int height, int width) {
        try {
            return qrCodeWriter.encode(
                    barCodeData,
                    BarcodeFormat.QR_CODE,
                    width,
                    height
            );
        } catch (WriterException e) {
            log.error("Could not generate QR code: ", e);
        }
        return null;
    }
}
