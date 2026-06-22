import { IdeWorkspace } from '@/workspace/IdeWorkspace';
import { NotificationToasts } from '@/components/NotificationToasts';

const Ide = () => {
  console.log("IDE PAGE LOADED");
  return (
    <>
      <IdeWorkspace />
      <NotificationToasts />
    </>
  );
};

export default Ide;
