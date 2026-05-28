import { IdeWorkspace } from '@/workspace/IdeWorkspace';
import { NotificationToasts } from '@/components/NotificationToasts';

const Ide = () => {
  return (
    <>
      <IdeWorkspace />
      <NotificationToasts />
    </>
  );
};

export default Ide;
