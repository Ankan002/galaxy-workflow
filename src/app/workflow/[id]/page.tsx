import { WorkflowScreen } from "@/screens/workflow";

interface Props {
	params: Promise<{
		id: string;
	}>;
}

const WorkflowPage: React.FC<Props> = async (props) => {
	await props.params;

	return <WorkflowScreen />;
};

export default WorkflowPage;
