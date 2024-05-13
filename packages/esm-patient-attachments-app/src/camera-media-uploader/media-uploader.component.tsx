import React, { useCallback, useContext, useState } from 'react';
import { FileUploaderDropContainer, InlineNotification } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '@openmrs/esm-framework';
import { readFileAsString } from '../utils';
import CameraMediaUploaderContext from './camera-media-uploader-context.resources';
import styles from './media-uploader.scss';
import { useAllowedExtensions } from '../attachments/use-allowed-extensions';

interface ErrorNotification {
  title: string;
  subtitle: string;
}

const MediaUploaderComponent = () => {
  const { t } = useTranslation();
  const { allowedExtensions } = useAllowedExtensions();
  const { maxFileSize } = useConfig();
  const { setFilesToUpload, multipleFiles } = useContext(CameraMediaUploaderContext);
  const [errorNotification, setErrorNotification] = useState<ErrorNotification>(null);
  const upload = useCallback(
    (files: Array<File>) => {
      files.forEach((file) => {
        if (file.size > maxFileSize * 1024 * 1024) {
          setErrorNotification({
            title: t('fileSizeLimitExceededText', 'File size limit exceeded'),
            subtitle: `${file.name} ${t('fileSizeLimitExceeded', 'exceeds the size limit of')} ${maxFileSize} MB.`,
          });
        } else if (!isFileExtensionAllowed(file.type, allowedExtensions)) {
          const allowedExtensionsString = allowedExtensions
            .map((mimeType, index, array) => {
              const extension = mimeType.split('/').pop();
              return index === array.length - 1 ? `and ${extension}` : extension;
            })
            .join(', ');

          setErrorNotification({
            title: t('fileExtensionNotAllowedText', 'File extension is not allowed'),
            subtitle: `${file.name} ${t(
              'allowedExtensionsAre',
              'Allowed extensions are: ',
            )} ${allowedExtensionsString}.`,
          });
        } else {
          // Convert MBs to bytes
          readFileAsString(file).then((base64Content) => {
            setFilesToUpload((uriData) => [
              ...uriData,
              {
                base64Content,
                file,
                fileName: file.name,
                fileType:
                  file.type.split('/')[0] === 'image' ? 'image' : file.type.split('/')[1] === 'pdf' ? 'pdf' : 'other',
                fileDescription: '',
                status: 'uploading',
              },
            ]);
          });
        }
      });
    },
    [setFilesToUpload, maxFileSize, t],
  );

  const isFileExtensionAllowed = (fileType: string, allowedExtensions: string[]): boolean =>
    allowedExtensions.includes(fileType);

  return (
    <div className="cds--file__container">
      {errorNotification && (
        <div className={styles.errorContainer}>
          <InlineNotification
            aria-label="Upload error notification"
            kind="error"
            onClose={() => setErrorNotification(null)}
            subtitle={errorNotification.subtitle}
            title={errorNotification.title}
          />
        </div>
      )}
      <p className="cds--label-description">
        {t('fileUploadSizeConstraints', 'Size limit is {{fileSize}}MB', {
          fileSize: maxFileSize,
        })}
        .
      </p>
      <div className={styles.uploadFile}>
        <FileUploaderDropContainer
          accept={allowedExtensions}
          labelText={t('fileSizeInstructions', 'Drag and drop files here or click to upload')}
          tabIndex={0}
          multiple={multipleFiles}
          onAddFiles={(evt, { addedFiles }) => {
            upload(addedFiles);
          }}
        />
      </div>
    </div>
  );
};

export default MediaUploaderComponent;
